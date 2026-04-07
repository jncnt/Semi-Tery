-- SQL Setup for Cemetery Management App

-- 1. Profiles table (linked to Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'visitor' CHECK (role IN ('admin', 'staff', 'visitor')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Plots table
CREATE TABLE plots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_number TEXT UNIQUE NOT NULL,
  section TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Burial Records table
CREATE TABLE burial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_date DATE,
  death_date DATE,
  burial_date DATE,
  plot_id UUID REFERENCES plots(id) ON DELETE SET NULL,
  biography TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE burial_records ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are readable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for plots
CREATE POLICY "Plots are readable by everyone" ON plots FOR SELECT USING (true);
CREATE POLICY "Admin and Staff can manage plots" ON plots FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Policies for burial records
CREATE POLICY "Burial records are readable by everyone" ON burial_records FOR SELECT USING (true);
CREATE POLICY "Admin and Staff can manage records" ON burial_records FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')));

-- Trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'visitor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
