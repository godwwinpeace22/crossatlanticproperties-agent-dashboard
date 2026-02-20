-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT[], -- Array of strings for tags
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT, -- Cached author name for performance
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Policy: Only admins can create, update, delete blog posts
CREATE POLICY "Only admins can manage blog posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role in ('super_admin', 'admin', 'manager')
    )
  );

-- Create a storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view blog images
CREATE POLICY "Anyone can view blog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- Policy: Only admins can upload blog images
CREATE POLICY "Only admins can upload blog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'blog-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role in ('super_admin', 'admin', 'manager')
    )
  );

-- Policy: Only admins can delete blog images
CREATE POLICY "Only admins can delete blog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blog-images' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role in ('super_admin', 'admin', 'manager')
    )
  );

-- Insert some sample blog posts for testing
INSERT INTO blog_posts (
  title, 
  slug, 
  excerpt, 
  content, 
  image_url, 
  category, 
  tags, 
  status, 
  featured, 
  views, 
  author_name, 
  published_at
) VALUES 
(
  'Top 10 Luxury Properties in Lagos 2024',
  'top-10-luxury-properties-lagos-2024',
  'Discover the most exclusive and luxurious properties available in Lagos this year. From waterfront penthouses to exclusive gated communities.',
  '# Top 10 Luxury Properties in Lagos 2024

Lagos continues to be Nigeria''s premier destination for luxury real estate. Here are the top 10 most exclusive properties currently available:

## 1. Victoria Island Penthouse
This stunning penthouse offers panoramic views of the Lagos Harbor and comes with world-class amenities.

## 2. Ikoyi Waterfront Mansion
A magnificent 6-bedroom mansion with private beach access and a state-of-the-art home theater.

*[Content continues...]*',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop',
  'Market Analysis',
  ARRAY['Lagos', 'Luxury', 'Investment'],
  'published',
  true,
  1250,
  'John Doe',
  '2024-03-15 10:00:00+00'
),
(
  'Real Estate Investment Guide for Beginners',
  'real-estate-investment-guide-beginners',
  'Learn the fundamentals of real estate investment in Nigeria. A comprehensive guide for first-time investors.',
  '# Real Estate Investment Guide for Beginners

Investing in real estate can be one of the most rewarding financial decisions you make. Here''s everything you need to know to get started:

## Understanding the Market
Before investing, it''s crucial to understand market dynamics...

## Location, Location, Location
The three most important factors in real estate are location, location, and location...

*[Content continues...]*',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=2126&auto=format&fit=crop',
  'Investment',
  ARRAY['Investment', 'Guide', 'Beginners'],
  'published',
  false,
  890,
  'Jane Smith',
  '2024-03-12 14:30:00+00'
),
(
  'Abuja Property Market Trends 2024',
  'abuja-property-market-trends-2024',
  'An in-depth analysis of the current property market trends in Abuja, including price movements and investment opportunities.',
  '# Abuja Property Market Trends 2024

The Abuja property market has shown remarkable resilience and growth in 2024...

## Market Overview
Property values in key areas like Maitama, Asokoro, and Wuse have seen significant appreciation...

## Investment Hotspots
Several emerging areas are showing great potential for investors...

*[Content continues...]*',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
  'Market Analysis',
  ARRAY['Abuja', 'Trends', 'Analysis'],
  'published',
  false,
  675,
  'Michael Johnson',
  '2024-03-10 09:15:00+00'
),
(
  'Commercial Real Estate Opportunities',
  'commercial-real-estate-opportunities',
  'Draft article about commercial real estate investment opportunities in Nigeria''s major cities.',
  '# Commercial Real Estate Opportunities

This is a draft article exploring the various commercial real estate opportunities available across Nigeria...

## Office Spaces
The demand for modern office spaces continues to grow...

## Retail Properties
Shopping centers and retail spaces offer excellent investment potential...

*[Content continues...]*',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
  'Commercial',
  ARRAY['Commercial', 'Investment'],
  'draft',
  false,
  0,
  'Sarah Williams',
  NULL
);