from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func, SmallInteger, Date
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

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

    __table_args__ = (
        {'postgresql_using': 'ivfflat',
         'postgresql_with': {'lists': 100}}
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