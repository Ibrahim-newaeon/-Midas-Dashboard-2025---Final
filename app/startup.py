#!/usr/bin/env python3
"""
Startup helper: ensure DB schema exists and run idempotency migration.

This module is safe to call on every app start (idempotent). It:
- Creates the database schema if furniture.db is missing (uses database.db_setup.create_database)
- Ensures the ingestion_runs audit table exists
- Creates a UNIQUE index idx_daily_perf_unique on (report_date, platform, ad_id, campaign_id)
  only if the required columns exist.
- Does NOT populate sample data automatically.
"""
import os
import sqlite3
import logging
from typing import List

import config

logger = logging.getLogger(__name__)


def _table_has_columns(conn: sqlite3.Connection, table: str, cols: List[str]) -> bool:
    cur = conn.execute(f"PRAGMA table_info('{table}')").fetchall()
    existing = [r[1] for r in cur]
    return all(c in existing for c in cols)


def ensure_db_initialized():
    """
    Ensure the SQLite DB (config.DB_PATH) has the schema and required index.
    This is safe to call on every startup.
    """
    try:
        db_path = config.DB_PATH
        # If DB file missing, create schema using existing helper
        if not os.path.exists(db_path):
            logger.info(f"Database not found at {db_path} — creating schema.")
            try:
                # Lazy import to avoid circular imports
                from database.db_setup import create_database
                create_database()
                logger.info("Database schema created.")
            except Exception as e:
                logger.exception(f"Failed to create database schema: {e}")
                return

        # Connect to DB and ensure ingestion_runs table exists and create index
        conn = sqlite3.connect(db_path)
        try:
            # Ensure ingestion_runs exists
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ingestion_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT,
                    start_date TEXT,
                    end_date TEXT,
                    user TEXT,
                    rows_deleted INTEGER,
                    rows_inserted INTEGER,
                    status TEXT,
                    created_at TEXT
                )
            """)
            conn.commit()

            # Create UNIQUE index for idempotency if the required columns exist
            required_cols = ['report_date', 'platform', 'ad_id', 'campaign_id']
            if _table_has_columns(conn, 'daily_performance', required_cols):
                conn.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_perf_unique
                    ON daily_performance(report_date, platform, ad_id, campaign_id)
                """)
                conn.commit()
                logger.info("Ensured unique index idx_daily_perf_unique exists.")
            else:
                logger.info("daily_performance table missing required columns for unique index. Skipping index creation.")
        finally:
            conn.close()
    except Exception:
        logger.exception("Error during DB initialization (ensure_db_initialized)")


# When imported, this module does not auto-run initialization.
# Call ensure_db_initialized() explicitly from dashboard.py at startup.
