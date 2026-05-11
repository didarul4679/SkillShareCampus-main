import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  course_id: string;
  course_title: string;
  amount: number;
  final_amount: number;
  discount_amount: number;
  coupon_code?: string;
  payment_method: string;
  user_id: string;
  user_email: string;
  user_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle IPN callback
    if (action === "ipn") {
      const formData = await req.formData();
      const status = formData.get("status") as string;
      const tranId = formData.get("tran_id") as string;
      const valId = formData.get("val_id") as string;
      const amount = formData.get("amount") as string;

      console.log("SSLCommerz IPN received:", { status, tranId, valId, amount });

      if (status === "VALID" || status === "VALIDATED") {
        const parts = tranId.split("_");
        const courseId = parts[0];
        const userId = parts[1];

        // Update transaction status
        await supabase
          .from("payment_transactions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            gateway_response: { status, valId, amount },
          })
          .eq("transaction_id", tranId);

        // Create enrollment
        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert({
            course_id: courseId,
            user_id: userId,
            status: "enrolled",
            payment_status: "completed",
          });

        if (enrollError) {
          console.error("Failed to create enrollment:", enrollError);
        } else {
          console.log("Enrollment created successfully");

          // Get coupon code from transaction and update usage
          const { data: transaction } = await supabase
            .from("payment_transactions")
            .select("coupon_code")
            .eq("transaction_id", tranId)
            .maybeSingle();

          if (transaction?.coupon_code) {
            // Update coupon used_count manually
            const { data: coupon } = await supabase
              .from("coupons")
              .select("id, used_count")
              .eq("code", transaction.coupon_code)
              .maybeSingle();

            if (coupon) {
              await supabase
                .from("coupons")
                .update({ used_count: (coupon.used_count || 0) + 1 })
                .eq("id", coupon.id);

              // Record coupon usage
              await supabase.from("coupon_usage").insert({
                coupon_id: coupon.id,
                user_id: userId,
              });
            }
          }
        }
      }

      return new Response("IPN Received", { headers: corsHeaders });
    }

    // Handle success redirect
    if (action === "success") {
      const formData = await req.formData();
      const tranId = formData.get("tran_id") as string;
      const [courseId] = tranId.split("_");
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${Deno.env.get("PUBLIC_SITE_URL") || "https://vryacxigxopdxxgrhfkp.lovableproject.com"}/courses/${courseId}?payment=success`,
        },
      });
    }

    // Handle failure redirect
    if (action === "fail") {
      const formData = await req.formData();
      const tranId = formData.get("tran_id") as string;
      const [courseId] = tranId.split("_");

      // Update transaction status
      await supabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("transaction_id", tranId);
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${Deno.env.get("PUBLIC_SITE_URL") || "https://vryacxigxopdxxgrhfkp.lovableproject.com"}/courses/${courseId}?payment=failed`,
        },
      });
    }

    // Handle cancel redirect
    if (action === "cancel") {
      const formData = await req.formData();
      const tranId = formData.get("tran_id") as string;
      const [courseId] = tranId.split("_");

      // Update transaction status
      await supabase
        .from("payment_transactions")
        .update({ status: "cancelled" })
        .eq("transaction_id", tranId);
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${Deno.env.get("PUBLIC_SITE_URL") || "https://vryacxigxopdxxgrhfkp.lovableproject.com"}/courses/${courseId}?payment=cancelled`,
        },
      });
    }

    // Initialize payment
    if (req.method === "POST") {
      // SECURITY: Extract user_id from JWT instead of trusting client
      const authHeader = req.headers.get("authorization");
      if (!authHeader) {
        console.error("Missing authorization header");
        return new Response(
          JSON.stringify({ success: false, error: "Authorization required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("Invalid token:", authError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid or expired token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authenticatedUserId = user.id;
      const authenticatedUserEmail = user.email || "";

      const body: PaymentRequest = await req.json();
      const {
        course_id,
        course_title,
        amount,
        final_amount,
        discount_amount,
        coupon_code,
        payment_method,
        user_name,
      } = body;

      // Use authenticated user's ID and email instead of client-provided values
      const user_id = authenticatedUserId;
      const user_email = authenticatedUserEmail;

      console.log("Initiating payment:", { course_id, amount, final_amount, payment_method, user_email, user_id });

      const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID");
      const storePassword = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");

      const tranId = `${course_id}_${user_id}_${Date.now()}`;
      const functionUrl = `${supabaseUrl}/functions/v1/sslcommerz-payment`;

      // Create transaction record
      const { error: txError } = await supabase.from("payment_transactions").insert({
        user_id,
        course_id,
        amount,
        discount_amount: discount_amount || 0,
        final_amount,
        payment_method,
        transaction_id: tranId,
        coupon_code: coupon_code || null,
        status: "pending",
      });

      if (txError) {
        console.error("Failed to create transaction:", txError);
        throw new Error("Failed to create transaction record");
      }

      // If no credentials, use sandbox mock mode
      if (!storeId || !storePassword) {
        console.log("Using mock payment mode");
        
        const mockPaymentUrl = `${functionUrl}?action=mock&tran_id=${tranId}&amount=${final_amount}&course_title=${encodeURIComponent(course_title)}&method=${payment_method}`;
        
        return new Response(
          JSON.stringify({
            success: true,
            mode: "sandbox_mock",
            payment_url: mockPaymentUrl,
            transaction_id: tranId,
            message: "Mock payment mode",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Real SSLCommerz integration
      const sslcommerzUrl = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
      
      const paymentData = new URLSearchParams({
        store_id: storeId,
        store_passwd: storePassword,
        total_amount: final_amount.toString(),
        currency: "BDT",
        tran_id: tranId,
        success_url: `${functionUrl}?action=success`,
        fail_url: `${functionUrl}?action=fail`,
        cancel_url: `${functionUrl}?action=cancel`,
        ipn_url: `${functionUrl}?action=ipn`,
        shipping_method: "NO",
        product_name: course_title,
        product_category: "Online Course",
        product_profile: "non-physical-goods",
        cus_name: user_name || "Customer",
        cus_email: user_email,
        cus_add1: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01700000000",
      });

      const response = await fetch(sslcommerzUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: paymentData,
      });

      const result = await response.json();
      console.log("SSLCommerz response:", result);

      if (result.status === "SUCCESS") {
        return new Response(
          JSON.stringify({
            success: true,
            mode: "sandbox",
            payment_url: result.GatewayPageURL,
            transaction_id: tranId,
            session_key: result.sessionkey,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Update transaction as failed
        await supabase
          .from("payment_transactions")
          .update({ status: "failed", gateway_response: result })
          .eq("transaction_id", tranId);

        throw new Error(result.failedreason || "Failed to initiate payment");
      }
    }

    // Handle mock payment page
    if (action === "mock") {
      const tranId = url.searchParams.get("tran_id") || "";
      const amount = url.searchParams.get("amount") || "0";
      const courseTitle = url.searchParams.get("course_title") || "Course";
      const method = url.searchParams.get("method") || "bkash";
      const [courseId, userId] = tranId.split("_");

      const methodColors: Record<string, { bg: string; text: string; name: string }> = {
        bkash: { bg: "#E2136E", text: "white", name: "bKash" },
        nagad: { bg: "#F6921E", text: "white", name: "Nagad" },
        card: { bg: "#1a73e8", text: "white", name: "Credit/Debit Card" },
        bank: { bg: "#2e7d32", text: "white", name: "Bank Transfer" },
      };

      const selectedMethod = methodColors[method] || methodColors.bkash;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment - ${selectedMethod.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, ${selectedMethod.bg}22 0%, #f8f9fa 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 0;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 25px 60px -12px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .header {
      background: ${selectedMethod.bg};
      color: ${selectedMethod.text};
      padding: 24px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 4px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .sandbox-badge {
      background: #fff3cd;
      color: #856404;
      padding: 12px 16px;
      text-align: center;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .content { padding: 24px; }
    .course-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .course-info h3 { font-size: 15px; margin-bottom: 4px; }
    .course-info p { color: #666; font-size: 13px; }
    .amount-display {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, ${selectedMethod.bg}11, ${selectedMethod.bg}05);
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .amount-display .label { color: #666; font-size: 14px; margin-bottom: 4px; }
    .amount-display .value { font-size: 36px; font-weight: 700; color: ${selectedMethod.bg}; }
    .payment-form { margin-bottom: 16px; }
    .input-group { margin-bottom: 16px; }
    .input-group label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
    .input-group input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    .input-group input:focus {
      outline: none;
      border-color: ${selectedMethod.bg};
    }
    .btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary {
      background: ${selectedMethod.bg};
      color: ${selectedMethod.text};
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-secondary {
      background: #f1f1f1;
      color: #333;
      margin-top: 10px;
    }
    .btn-secondary:hover { background: #e5e5e5; }
    .security-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      color: #888;
      font-size: 12px;
    }
    .security-info svg { width: 14px; height: 14px; }
    .loading { display: none; }
    .loading.active { display: flex; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${selectedMethod.name}</h1>
      <p>Secure Payment Gateway</p>
    </div>
    <div class="sandbox-badge">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
      </svg>
      Test Mode - No real payment will be processed
    </div>
    <div class="content">
      <div class="course-info">
        <h3>${courseTitle}</h3>
        <p>Online Course Enrollment</p>
      </div>
      <div class="amount-display">
        <div class="label">Amount to Pay</div>
        <div class="value">৳${amount}</div>
      </div>
      <form id="payForm" class="payment-form">
        <div class="input-group">
          <label>Phone Number (Demo)</label>
          <input type="tel" placeholder="01XXXXXXXXX" value="01700000000" required>
        </div>
        <div class="input-group">
          <label>PIN (Demo)</label>
          <input type="password" placeholder="Enter PIN" value="1234" required>
        </div>
        <button type="submit" class="btn btn-primary" id="payBtn">
          <span id="btnText">Confirm Payment ৳${amount}</span>
          <svg class="loading spinner" id="loadingIcon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
        </button>
      </form>
      <form action="${supabaseUrl}/functions/v1/sslcommerz-payment?action=cancel" method="POST">
        <input type="hidden" name="tran_id" value="${tranId}">
        <button type="submit" class="btn btn-secondary">Cancel Payment</button>
      </form>
      <div class="security-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Secured with 256-bit SSL encryption
      </div>
    </div>
  </div>
  <script>
    document.getElementById('payForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('payBtn');
      const text = document.getElementById('btnText');
      const loading = document.getElementById('loadingIcon');
      
      btn.disabled = true;
      text.textContent = 'Processing...';
      loading.classList.add('active');
      
      // Send IPN
      const formData = new FormData();
      formData.append('status', 'VALID');
      formData.append('tran_id', '${tranId}');
      formData.append('val_id', 'mock_' + Date.now());
      formData.append('amount', '${amount}');
      
      try {
        await fetch('${supabaseUrl}/functions/v1/sslcommerz-payment?action=ipn', {
          method: 'POST',
          body: formData
        });
        
        text.textContent = 'Payment Successful!';
        
        const successUrl = '${Deno.env.get("PUBLIC_SITE_URL") || "https://vryacxigxopdxxgrhfkp.lovableproject.com"}/courses/${courseId}?payment=success';
        
        // Show countdown and redirect
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            text.textContent = 'Redirecting in ' + countdown + '...';
          }
        }, 1000);
        
        setTimeout(() => {
          clearInterval(countdownInterval);
          
          // Method 1: Try direct opener access
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.location.href = successUrl;
              window.close();
              return;
            }
          } catch (e) {
            console.log('Direct opener access blocked:', e);
          }
          
          // Method 2: Try postMessage
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'payment_success', url: successUrl }, '*');
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 500);
              return;
            }
          } catch (e) {
            console.log('postMessage failed:', e);
          }
          
          // Method 3: Redirect in current window
          window.location.href = successUrl;
        }, 3000);
      } catch (err) {
        text.textContent = 'Payment Failed';
        btn.disabled = false;
        loading.classList.remove('active');
      }
    });
  </script>
</body>
</html>`;

      return new Response(html, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
