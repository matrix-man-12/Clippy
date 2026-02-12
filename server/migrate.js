import pool from './db.js';

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable uuid extension
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Clipboard items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clipboard_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'rich_text', 'json', 'image')),
        content_text TEXT,
        content_blob_url VARCHAR(2048),
        content_image BYTEA,
        content_image_mime VARCHAR(50),
        content_image_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expiry_at TIMESTAMP WITH TIME ZONE,
        is_favorite BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Clipboard items indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clipboard_items_owner_created 
        ON clipboard_items (owner_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clipboard_items_expiry 
        ON clipboard_items (expiry_at) WHERE expiry_at IS NOT NULL;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clipboard_items_type 
        ON clipboard_items (content_type);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clipboard_items_deleted 
        ON clipboard_items (deleted_at) WHERE deleted_at IS NOT NULL;
    `);

    // Shared collections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared_collections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Collection members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_members (
        collection_id UUID NOT NULL REFERENCES shared_collections(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_level VARCHAR(10) NOT NULL CHECK (permission_level IN ('view', 'upload')),
        PRIMARY KEY (collection_id, user_id)
      );
    `);

    // Collection items mapping table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collection_items (
        collection_id UUID NOT NULL REFERENCES shared_collections(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES clipboard_items(id) ON DELETE CASCADE,
        PRIMARY KEY (collection_id, item_id)
      );
    `);

    // QR tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS qr_tokens (
        token VARCHAR(64) PRIMARY KEY,
        content_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
