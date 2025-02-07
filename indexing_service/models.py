from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func, SmallInteger, Date, Index, Float, Enum, Boolean, JSON, REAL
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT, UUID, JSONB, TSVECTOR, DOUBLE_PRECISION
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
import uuid

Base = declarative_base()

class AnalysisStatus(enum.Enum):
    pending = 'pending'
    processing = 'processing'
    completed = 'completed'
    failed = 'failed'

class BlogPostStatus(enum.Enum):
    draft = 'draft'
    review = 'review'
    published = 'published'
    archived = 'archived'

class VectorIndex(Base):
    __tablename__ = 'vector_index'

    id = Column(Integer, primary_key=True)
    entity_type = Column(String(7), nullable=False)  # 'bill' or 'sponsor'
    entity_id = Column(Integer, nullable=False)
    search_text = Column(Text, nullable=False)
    embedding = Column(ARRAY(FLOAT), nullable=False)
    source_hash = Column(String(64), nullable=False)
    state_abbr = Column(String(2), nullable=False)
    state_name = Column(String(50), nullable=False)
    indexed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Create indexes
    __table_args__ = (
        Index('ix_vector_index_embedding', 'embedding', postgresql_using='ivfflat', postgresql_with={'lists': 100}),
        Index('ix_vector_index_entity', 'entity_type', 'entity_id', unique=True),
        Index('ix_vector_index_search_text', 'search_text', postgresql_using='gin'),
    )

class State(Base):
    __tablename__ = 'ls_state'
    
    state_id = Column(SmallInteger, primary_key=True)
    state_abbr = Column(String(2), nullable=False)
    state_name = Column(String(64), nullable=False)

class Body(Base):
    __tablename__ = 'ls_body'
    
    body_id = Column(SmallInteger, primary_key=True)
    state_id = Column(SmallInteger, ForeignKey('ls_state.state_id'), nullable=False)
    body_abbr = Column(String(1), nullable=False)
    body_name = Column(String(128), nullable=False)

class Committee(Base):
    __tablename__ = 'ls_committee'
    
    committee_id = Column(SmallInteger, primary_key=True)
    committee_body_id = Column(SmallInteger, ForeignKey('ls_body.body_id'), nullable=False)
    committee_name = Column(String(128), nullable=False)

class Bill(Base):
    __tablename__ = 'ls_bill'

    bill_id = Column(Integer, primary_key=True)
    state_id = Column(SmallInteger, ForeignKey('ls_state.state_id'), nullable=False)
    session_id = Column(SmallInteger, nullable=False)
    body_id = Column(SmallInteger, ForeignKey('ls_body.body_id'), nullable=False)
    current_body_id = Column(SmallInteger, ForeignKey('ls_body.body_id'), nullable=False)
    bill_type_id = Column(SmallInteger, nullable=False)
    bill_number = Column(String(10), nullable=False)
    status_id = Column(SmallInteger, nullable=False)
    status_date = Column(Date)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    pending_committee_id = Column(SmallInteger, ForeignKey('ls_committee.committee_id'), nullable=False)
    legiscan_url = Column(String(255), nullable=False)
    state_url = Column(String(255), nullable=False)
    change_hash = Column(String(32), nullable=False)
    updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    state = relationship('State')
    body = relationship('Body', foreign_keys=[body_id])
    current_body = relationship('Body', foreign_keys=[current_body_id])
    pending_committee = relationship('Committee')

class Party(Base):
    __tablename__ = 'ls_party'

    party_id = Column(SmallInteger, primary_key=True)
    party_abbr = Column(String(1), nullable=False)
    party_short = Column(String(3), nullable=False)
    party_name = Column(String(32), nullable=False)

class Sponsor(Base):
    __tablename__ = 'ls_people'

    people_id = Column(SmallInteger, primary_key=True)
    state_id = Column(SmallInteger, ForeignKey('ls_state.state_id'), nullable=False)
    role_id = Column(SmallInteger, nullable=False)
    party_id = Column(SmallInteger, ForeignKey('ls_party.party_id'), nullable=False, default=0)
    name = Column(String(128), nullable=False)
    first_name = Column(String(32), nullable=False)
    middle_name = Column(String(32), nullable=False)
    last_name = Column(String(32), nullable=False)
    suffix = Column(String(32), nullable=False)
    nickname = Column(String(32), nullable=False)
    district = Column(String(9), default='')
    committee_sponsor_id = Column(SmallInteger, nullable=False, default=0)
    person_hash = Column(String(8), nullable=False)
    updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    state = relationship('State')
    party = relationship('Party')

class LegislationCluster(Base):
    __tablename__ = 'legislation_clusters'

    cluster_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_name = Column(String(255))
    centroid_vector = Column(ARRAY(FLOAT))
    reduced_vector = Column(ARRAY(FLOAT))
    min_date = Column(Date)
    max_date = Column(Date)
    bill_count = Column(Integer, nullable=False, default=0)
    state_count = Column(Integer, nullable=False, default=0)
    cluster_description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ClusterBill(Base):
    __tablename__ = 'cluster_bills'

    cluster_id = Column(UUID(as_uuid=True), ForeignKey('legislation_clusters.cluster_id'), primary_key=True)
    bill_id = Column(Integer, ForeignKey('ls_bill.bill_id'), primary_key=True)
    distance_to_centroid = Column(Float)
    membership_confidence = Column(Float)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    cluster = relationship('LegislationCluster')
    bill = relationship('Bill')

class ClusterAnalysis(Base):
    __tablename__ = 'cluster_analysis'

    analysis_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey('legislation_clusters.cluster_id'))
    status = Column(Enum(AnalysisStatus), nullable=False, default=AnalysisStatus.pending)
    input_token_count = Column(Integer)
    output_token_count = Column(Integer)
    analysis_parameters = Column(JSONB)
    executive_summary = Column(Text)
    policy_impacts = Column(JSONB)
    risk_assessment = Column(JSONB)
    future_outlook = Column(Text)
    raw_llm_response = Column(JSONB)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cluster = relationship('LegislationCluster')

class BlogPost(Base):
    __tablename__ = 'blog_posts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey('legislation_clusters.cluster_id'), nullable=True)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey('cluster_analysis.analysis_id'), nullable=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    status = Column(Enum(BlogPostStatus), nullable=False, default=BlogPostStatus.draft)
    content = Column(Text, nullable=False)
    post_metadata = Column(JSONB, nullable=True)
    author = Column(String(100))
    is_curated = Column(Boolean, nullable=False, default=False)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    search_vector = Column(TSVECTOR)

    # Relationships
    cluster = relationship('LegislationCluster')
    analysis = relationship('ClusterAnalysis')

    __table_args__ = (
        Index('ix_blog_posts_search_vector', 'search_vector', postgresql_using='gin'),
    ) 