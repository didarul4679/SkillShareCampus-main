-- Seed sample courses
INSERT INTO public.courses (id, title, description, instructor, category, difficulty_level, price, duration_hours, is_published, thumbnail_url, rating, students_count) VALUES
('11111111-1111-1111-1111-111111111111', 'HTML & CSS Fundamentals', 'Master the building blocks of web development. Learn semantic HTML5, modern CSS3, Flexbox, Grid, and responsive design principles.', 'Sarah Johnson', 'Web Development', 'beginner', 0, 12, true, 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400', 4.8, 1250),
('22222222-2222-2222-2222-222222222222', 'JavaScript Mastery', 'From fundamentals to advanced concepts. Learn ES6+, async programming, DOM manipulation, and build real-world projects.', 'Michael Chen', 'Web Development', 'intermediate', 29, 24, true, 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400', 4.9, 890),
('33333333-3333-3333-3333-333333333333', 'Java Programming', 'Comprehensive Java course covering OOP, data structures, algorithms, and enterprise application development.', 'David Smith', 'Programming', 'beginner', 49, 30, true, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', 4.7, 650),
('44444444-4444-4444-4444-444444444444', 'PHP & MySQL Development', 'Build dynamic web applications with PHP and MySQL. Learn MVC patterns, security best practices, and database design.', 'Emily Davis', 'Web Development', 'intermediate', 0, 18, true, 'https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=400', 4.5, 420),
('55555555-5555-5555-5555-555555555555', 'React.js for Beginners', 'Learn React from scratch. Build modern, interactive UIs with hooks, context, routing, and state management.', 'Alex Turner', 'Web Development', 'beginner', 39, 20, true, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', 4.9, 1100),
('66666666-6666-6666-6666-666666666666', 'Digital Marketing Course', 'Master SEO, social media marketing, email campaigns, analytics, and content strategy for business growth.', 'Jessica Miller', 'Marketing', 'beginner', 0, 15, true, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', 4.6, 780),
('77777777-7777-7777-7777-777777777777', 'Ruby on Rails', 'Build powerful web applications with Ruby on Rails. Learn MVC, ActiveRecord, testing, and deployment strategies.', 'Chris Anderson', 'Web Development', 'advanced', 59, 28, true, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400', 4.8, 320),
('88888888-8888-8888-8888-888888888888', 'C Programming Basics', 'Foundation course in C programming. Learn memory management, pointers, data structures, and system programming.', 'Robert Wilson', 'Programming', 'beginner', 0, 16, true, 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400', 4.4, 540);

-- Seed lessons for HTML & CSS Fundamentals
INSERT INTO public.course_lessons (course_id, title, description, order_index, content_type, duration_minutes, is_free_preview, content_text) VALUES
('11111111-1111-1111-1111-111111111111', 'Introduction to HTML', 'Learn the basics of HTML structure and elements', 1, 'video', 15, true, 'Welcome to HTML! In this lesson, we cover document structure, tags, and attributes.'),
('11111111-1111-1111-1111-111111111111', 'HTML Elements & Tags', 'Deep dive into common HTML elements', 2, 'video', 20, false, 'Explore headings, paragraphs, lists, links, and images.'),
('11111111-1111-1111-1111-111111111111', 'CSS Fundamentals', 'Introduction to CSS styling', 3, 'video', 25, false, 'Learn selectors, properties, and the cascade.'),
('11111111-1111-1111-1111-111111111111', 'Flexbox Layout', 'Master CSS Flexbox', 4, 'video', 30, false, 'Create flexible, responsive layouts with Flexbox.'),
('11111111-1111-1111-1111-111111111111', 'CSS Grid', 'Advanced layout with Grid', 5, 'video', 35, false, 'Build complex two-dimensional layouts.'),
('11111111-1111-1111-1111-111111111111', 'Responsive Design', 'Make your sites mobile-friendly', 6, 'video', 25, false, 'Media queries and responsive design patterns.');

-- Seed lessons for JavaScript Mastery
INSERT INTO public.course_lessons (course_id, title, description, order_index, content_type, duration_minutes, is_free_preview, content_text) VALUES
('22222222-2222-2222-2222-222222222222', 'JavaScript Basics', 'Variables, data types, and operators', 1, 'video', 20, true, 'Start your JavaScript journey with fundamentals.'),
('22222222-2222-2222-2222-222222222222', 'Functions & Scope', 'Understanding functions and scope', 2, 'video', 25, false, 'Deep dive into function declarations, expressions, and closures.'),
('22222222-2222-2222-2222-222222222222', 'Arrays & Objects', 'Working with complex data', 3, 'video', 30, false, 'Master arrays, objects, and their methods.'),
('22222222-2222-2222-2222-222222222222', 'DOM Manipulation', 'Interact with the webpage', 4, 'video', 35, false, 'Select, modify, and create DOM elements.'),
('22222222-2222-2222-2222-222222222222', 'Async JavaScript', 'Promises and async/await', 5, 'video', 40, false, 'Handle asynchronous operations elegantly.'),
('22222222-2222-2222-2222-222222222222', 'ES6+ Features', 'Modern JavaScript features', 6, 'video', 30, false, 'Destructuring, spread, modules, and more.'),
('22222222-2222-2222-2222-222222222222', 'Project: Todo App', 'Build a complete application', 7, 'text', 45, false, 'Apply your knowledge in a real project.');

-- Seed lessons for React.js for Beginners
INSERT INTO public.course_lessons (course_id, title, description, order_index, content_type, duration_minutes, is_free_preview, content_text) VALUES
('55555555-5555-5555-5555-555555555555', 'What is React?', 'Introduction to React and its ecosystem', 1, 'video', 15, true, 'Understand why React is popular and when to use it.'),
('55555555-5555-5555-5555-555555555555', 'Components & JSX', 'Building blocks of React apps', 2, 'video', 25, false, 'Create reusable UI components with JSX.'),
('55555555-5555-5555-5555-555555555555', 'Props & State', 'Managing data in React', 3, 'video', 30, false, 'Pass data with props and manage state.'),
('55555555-5555-5555-5555-555555555555', 'React Hooks', 'useState, useEffect, and more', 4, 'video', 40, false, 'Master the most important React hooks.'),
('55555555-5555-5555-5555-555555555555', 'React Router', 'Navigation in React apps', 5, 'video', 25, false, 'Add routing to your single-page application.'),
('55555555-5555-5555-5555-555555555555', 'Context API', 'Global state management', 6, 'video', 30, false, 'Share state across components without prop drilling.'),
('55555555-5555-5555-5555-555555555555', 'Project: Dashboard', 'Build a complete React app', 7, 'text', 60, false, 'Create a dashboard with everything you learned.');

-- Seed lessons for Java Programming
INSERT INTO public.course_lessons (course_id, title, description, order_index, content_type, duration_minutes, is_free_preview, content_text) VALUES
('33333333-3333-3333-3333-333333333333', 'Java Setup & Basics', 'Install Java and write your first program', 1, 'video', 20, true, 'Set up your development environment and hello world.'),
('33333333-3333-3333-3333-333333333333', 'Variables & Data Types', 'Understanding Java types', 2, 'video', 25, false, 'Primitive types, strings, and type casting.'),
('33333333-3333-3333-3333-333333333333', 'Control Flow', 'If statements and loops', 3, 'video', 30, false, 'Make decisions and repeat code.'),
('33333333-3333-3333-3333-333333333333', 'Object-Oriented Programming', 'Classes and objects', 4, 'video', 45, false, 'Master OOP concepts in Java.'),
('33333333-3333-3333-3333-333333333333', 'Inheritance & Polymorphism', 'Advanced OOP', 5, 'video', 40, false, 'Extend classes and override methods.'),
('33333333-3333-3333-3333-333333333333', 'Collections Framework', 'Lists, Sets, and Maps', 6, 'video', 35, false, 'Work with Java collections effectively.');

-- Seed lessons for Digital Marketing
INSERT INTO public.course_lessons (course_id, title, description, order_index, content_type, duration_minutes, is_free_preview, content_text) VALUES
('66666666-6666-6666-6666-666666666666', 'Digital Marketing Overview', 'Understanding the digital landscape', 1, 'video', 15, true, 'Introduction to digital marketing channels.'),
('66666666-6666-6666-6666-666666666666', 'SEO Fundamentals', 'Search engine optimization basics', 2, 'video', 30, false, 'On-page and off-page SEO strategies.'),
('66666666-6666-6666-6666-666666666666', 'Social Media Marketing', 'Leverage social platforms', 3, 'video', 35, false, 'Facebook, Instagram, LinkedIn, and Twitter strategies.'),
('66666666-6666-6666-6666-666666666666', 'Email Marketing', 'Build effective email campaigns', 4, 'video', 25, false, 'Create newsletters and automation sequences.'),
('66666666-6666-6666-6666-666666666666', 'Analytics & Metrics', 'Measure your success', 5, 'video', 30, false, 'Google Analytics and KPI tracking.');