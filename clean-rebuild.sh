#!/bin/bash

# Stop any running Next.js servers
echo "Stopping any running Next.js servers..."
pkill -f "next dev" || true

# Remove all Next.js cache and build files
echo "Removing Next.js cache and build files..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

# Regenerate package-lock.json
echo "Cleaning node_modules..."
bun install

# Restart the development server
echo "Starting development server..."
bunx --bun next dev -H 0.0.0.0
