-- Create favorites table for users to save properties
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create property inquiries table to store contact form submissions
CREATE TABLE IF NOT EXISTS property_inquiries (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_created_at ON property_inquiries(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for property inquiries
CREATE POLICY "Anyone can insert property inquiries" ON property_inquiries
  FOR INSERT WITH CHECK (true);

-- Allow agents/admins to view all inquiries (you can customize this based on your user roles)
CREATE POLICY "Authenticated users can view inquiries" ON property_inquiries
  FOR SELECT USING (auth.role() = 'authenticated');