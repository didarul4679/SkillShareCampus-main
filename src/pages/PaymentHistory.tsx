import { AppHeader } from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentHistory } from "@/hooks/usePayment";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Receipt,
  BookOpen,
} from "lucide-react";

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case "bkash":
    case "nagad":
      return <Smartphone className="h-4 w-4" />;
    case "card":
      return <CreditCard className="h-4 w-4" />;
    case "bank":
      return <Building2 className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="secondary">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refunded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
  }
};

const PaymentHistory = () => {
  const { data: transactions = [], isLoading } = usePaymentHistory();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader currentPage="courses" />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-muted-foreground">
              View all your course purchase transactions
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Your payment history will appear here after you purchase a course
              </p>
              <Button asChild>
                <Link to="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Course Thumbnail */}
                    <div className="md:w-32 h-24 md:h-auto">
                      {transaction.course?.thumbnail_url ? (
                        <img
                          src={transaction.course.thumbnail_url}
                          alt={transaction.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold">
                            {transaction.course?.title || "Course"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getPaymentMethodIcon(transaction.payment_method)}
                              {transaction.payment_method.charAt(0).toUpperCase() +
                                transaction.payment_method.slice(1)}
                            </span>
                            <span>•</span>
                            <span>
                              {format(new Date(transaction.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                            {transaction.transaction_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-xs">
                                  #{transaction.transaction_id.slice(-8)}
                                </span>
                              </>
                            )}
                          </div>
                          {transaction.coupon_code && (
                            <Badge variant="outline" className="text-xs">
                              Coupon: {transaction.coupon_code}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(transaction.status)}
                          <div className="text-right">
                            {transaction.discount_amount > 0 && (
                              <div className="text-xs text-muted-foreground line-through">
                                ৳{Number(transaction.amount).toFixed(0)}
                              </div>
                            )}
                            <div className="text-lg font-bold text-primary">
                              ৳{Number(transaction.final_amount).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PaymentHistory;
