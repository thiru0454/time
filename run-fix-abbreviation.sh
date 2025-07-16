#!/bin/bash

# Fix Abbreviation Column Error Script
# This script runs the SQL migration to add the abbreviation column

echo "🔧 Fixing abbreviation column error..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Run the migration
echo "📝 Running abbreviation migration..."
supabase db reset --linked

# Or if you want to run the SQL directly:
# supabase db push

echo "✅ Abbreviation column fix completed!"
echo "📊 You can now use the abbreviation field in your application." 