# migrations/create_stats_cache.py
"""Migration pour créer la table stats_cache"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers
revision = 'stats_cache_001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Créer la table stats_cache"""
    op.create_table('stats_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cache_key', sa.String(100), nullable=False),
        sa.Column('cache_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cache_key', name='unique_cache_key')
    )
    op.create_index('idx_expires_at', 'stats_cache', ['expires_at'])

def downgrade():
    """Supprimer la table stats_cache"""
    op.drop_index('idx_expires_at', table_name='stats_cache')
    op.drop_table('stats_cache')