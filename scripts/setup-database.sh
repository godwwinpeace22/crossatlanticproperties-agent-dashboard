#!/bin/bash

# Database Setup Script for Crossatlantic Properties Dashboard
# This script runs all SQL migrations in the correct order

echo "🚀 Starting database setup..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Array of SQL files to run in order
SQL_FILES=(
    "000_create_updated_at_function.sql"
    "010_create_terms_acceptances.sql" 
    "011_create_system_settings.sql"
    "012_create_user_documents.sql"
    "013_add_document_ids_to_kyc.sql"
    "014_add_document_id_to_payments.sql"
    "015_fix_user_documents_foreign_keys.sql"
)

# Run each SQL file
for file in "${SQL_FILES[@]}"; do
    if [ -f "scripts/$file" ]; then
        echo "📄 Running $file..."
        supabase db reset --db-url "$DATABASE_URL" < "scripts/$file"
        if [ $? -eq 0 ]; then
            echo "✅ $file completed successfully"
        else
            echo "❌ Error running $file"
            exit 1
        fi
    else
        echo "⚠️  File scripts/$file not found, skipping..."
    fi
done

echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Summary of created tables:"
echo "   - terms_acceptances (user consent tracking)"
echo "   - system_settings (platform configuration)"
echo "   - user_documents (document management)"
echo ""
echo "🔧 Functions created:"
echo "   - handle_updated_at() (automatic timestamp updates)"
echo ""
echo "✨ Your database is now ready for the MLM dashboard!"