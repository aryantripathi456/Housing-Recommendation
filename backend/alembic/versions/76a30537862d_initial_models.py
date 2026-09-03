"""initial models

Revision ID: 76a30537862d
Revises: 
Create Date: 2026-09-03 19:30:29.751085
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


revision: str = '76a30537862d'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'properties',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('address', sa.Text(), nullable=False),
        sa.Column('city', sa.String(100), nullable=False, index=True),
        sa.Column('locality', sa.String(100), nullable=False, index=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('location', Geometry('POINT', srid=4326)),
        sa.Column('rent', sa.Integer(), nullable=False, index=True),
        sa.Column('bedrooms', sa.Integer(), nullable=False),
        sa.Column('area_sqft', sa.Integer(), nullable=False),
        sa.Column('property_type', sa.String(50), server_default='apartment'),
        sa.Column('amenities', sa.JSON(), server_default='[]'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'pois',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('osm_id', sa.String(50), unique=True, index=True),
        sa.Column('name', sa.String(255)),
        sa.Column('category', sa.String(50), nullable=False, index=True),
        sa.Column('subcategory', sa.String(50)),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('location', Geometry('POINT', srid=4326)),
        sa.Column('rating', sa.Float(), server_default='0.0'),
    )

    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('persona_mode', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), server_default='Guest User'),
        sa.Column('monthly_income', sa.Integer(), server_default='50000'),
        sa.Column('budget', sa.Integer(), nullable=False),
        sa.Column('workplace_lat', sa.Float()),
        sa.Column('workplace_lon', sa.Float()),
        sa.Column('bedrooms', sa.Integer(), server_default='2'),
        sa.Column('preferences', sa.JSON(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'commute_results',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id'), nullable=False),
        sa.Column('destination_name', sa.String(255)),
        sa.Column('mode', sa.String(20), nullable=False),
        sa.Column('duration_min', sa.Float(), nullable=False),
        sa.Column('distance_km', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'liveability_scores',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id'), unique=True, nullable=False),
        sa.Column('transport', sa.Float(), server_default='0.0'),
        sa.Column('education', sa.Float(), server_default='0.0'),
        sa.Column('healthcare', sa.Float(), server_default='0.0'),
        sa.Column('shopping', sa.Float(), server_default='0.0'),
        sa.Column('environment', sa.Float(), server_default='0.0'),
        sa.Column('overall', sa.Float(), server_default='0.0'),
        sa.Column('computed_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'price_trends',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('property_id', sa.Integer(), sa.ForeignKey('properties.id'), nullable=False),
        sa.Column('month', sa.String(7), nullable=False),
        sa.Column('rent', sa.Integer(), nullable=False),
        sa.Column('locality_avg_rent', sa.Integer()),
    )


def downgrade() -> None:
    op.drop_table('price_trends')
    op.drop_table('liveability_scores')
    op.drop_table('commute_results')
    op.drop_table('user_profiles')
    op.drop_table('pois')
    op.drop_table('properties')
