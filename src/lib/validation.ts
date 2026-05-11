import { z } from "zod";

// Message validation schema
export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2000 characters"),
});

// Post validation schema
export const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content cannot be empty")
    .max(5000, "Post must be less than 5000 characters"),
  hashtags: z
    .array(z.string().regex(/^#\w+$/, "Invalid hashtag format"))
    .max(10, "Maximum 10 hashtags allowed")
    .optional(),
});

// Comment validation schema
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment must be less than 500 characters"),
});

// Sanitize HTML to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Validate and sanitize message
export const validateMessage = (content: string) => {
  const result = messageSchema.safeParse({ content });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return sanitizeInput(result.data.content);
};

// Validate and sanitize post
export const validatePost = (content: string, hashtags: string[]) => {
  const result = postSchema.safeParse({ content, hashtags });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return {
    content: sanitizeInput(result.data.content),
    hashtags: result.data.hashtags || [],
  };
};

// Validate and sanitize comment
export const validateComment = (content: string) => {
  const result = commentSchema.safeParse({ content });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return sanitizeInput(result.data.content);
};

// Profile validation schemas
export const profileBasicInfoSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  bio: z
    .string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, "Location must be less than 100 characters")
    .optional(),
  company: z
    .string()
    .trim()
    .max(100, "Company must be less than 100 characters")
    .optional(),
});

export const educationSchema = z.object({
  institution: z
    .string()
    .trim()
    .min(2, "Institution name is required")
    .max(200, "Institution must be less than 200 characters"),
  degree: z
    .string()
    .trim()
    .max(200, "Degree must be less than 200 characters")
    .optional(),
  period: z
    .string()
    .trim()
    .max(50, "Period must be less than 50 characters")
    .optional(),
});

export const experienceSchema = z.object({
  company: z
    .string()
    .trim()
    .min(2, "Company name is required")
    .max(200, "Company must be less than 200 characters"),
  position: z
    .string()
    .trim()
    .min(2, "Position is required")
    .max(200, "Position must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  period: z
    .string()
    .trim()
    .max(50, "Period must be less than 50 characters")
    .optional(),
});

export const skillSchema = z.object({
  skill_name: z
    .string()
    .trim()
    .min(2, "Skill name must be at least 2 characters")
    .max(50, "Skill name must be less than 50 characters"),
});

export const achievementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .max(300, "Description must be less than 300 characters")
    .optional(),
  icon: z
    .string()
    .trim()
    .max(50, "Icon must be less than 50 characters")
    .optional(),
});

// Authentication validation schemas
export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must be less than 72 characters"),
});
