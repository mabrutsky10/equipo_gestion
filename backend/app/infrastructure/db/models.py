from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey, CheckConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.infrastructure.db.session import Base


class LevelModel(Base):
    __tablename__ = "levels"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    socios_desde = Column(Integer, nullable=True, default=0)


class TeamModel(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    currency_default = Column(String(10), default="ARS", nullable=False)
    mas10_team_id = Column(Integer, nullable=True, index=True)
    mas10_username = Column(String(255), nullable=True, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"), default=0, nullable=False, index=True)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship
    level = relationship("LevelModel", foreign_keys=[level_id])


class MemberModel(Base):
    __tablename__ = "members"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    userprofile_id = Column(Integer, ForeignKey("userprofile.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    subscription_link = Column(String(500), nullable=True)
    subscription_status = Column(String(50), default="inactive", nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="check_member_status"),
        CheckConstraint("subscription_status IN ('active', 'paused', 'cancelled', 'inactive')", name="check_subscription_status"),
    )


class SponsorModel(Base):
    __tablename__ = "sponsors"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    subscription_link = Column(String(500), nullable=True)
    subscription_status = Column(String(50), default="inactive", nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("subscription_status IN ('active', 'paused', 'cancelled', 'inactive')", name="check_sponsor_subscription_status"),
    )


class CollectaModel(Base):
    __tablename__ = "collectas"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    link_public = Column(String(500), nullable=True)
    status = Column(String(50), default="active", nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_end = Column(DateTime(timezone=True), nullable=True)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('active', 'closed', 'cancelled')", name="check_collecta_status"),
    )


class CollectaInvitedMemberModel(Base):
    __tablename__ = "collecta_invited_members"
    
    id = Column(Integer, primary_key=True, index=True)
    collecta_id = Column(Integer, ForeignKey("collectas.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=True)
    external_email = Column(String(255), nullable=True)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ConfigCuotaModel(Base):
    __tablename__ = "config_cuota"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), unique=True, nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    moneda = Column(String(10), default="ARS", nullable=False)
    provider = Column(String(50), default="manual", nullable=False)
    status = Column(String(50), default="active", nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="check_config_cuota_status"),
    )


class MovementModel(Base):
    __tablename__ = "movements"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    tipo = Column(String(50), nullable=False, index=True)
    monto_bruto = Column(Numeric(10, 2), nullable=False)
    monto_fee = Column(Numeric(10, 2), default=0, nullable=False)
    monto_neto = Column(Numeric(10, 2), nullable=False)
    moneda = Column(String(10), default="ARS", nullable=False)
    metodo_pago = Column(String(50), default="manual", nullable=False)
    origen_tipo = Column(String(50), nullable=False)
    origen_id = Column(Integer, nullable=True)
    estado = Column(String(50), default="confirmed", nullable=False, index=True)
    description = Column(Text, nullable=True)
    payment_provider = Column(String(50), default="manual", nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("tipo IN ('cuota', 'colecta', 'aporte', 'sponsor', 'fee', 'cashout')", name="check_movement_tipo"),
        CheckConstraint("origen_tipo IN ('member', 'sponsor', 'collecta', 'manual', 'system')", name="check_movement_origen_tipo"),
        CheckConstraint("estado IN ('confirmed', 'pending', 'cancelled')", name="check_movement_estado"),
    )


class PaymentLinkModel(Base):
    __tablename__ = "payment_links"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    link_url = Column(String(500), nullable=False)
    provider = Column(String(50), default="manual", nullable=False)
    status = Column(String(50), default="active", nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("entity_type IN ('member', 'sponsor', 'collecta')", name="check_payment_link_entity_type"),
        CheckConstraint("status IN ('active', 'inactive', 'expired')", name="check_payment_link_status"),
    )


class CampaignModel(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    team_name = Column(String(255), nullable=False)
    team_logo = Column(Text, nullable=True)
    team_bio = Column(Text, nullable=True)
    tournament_name = Column(String(255), nullable=True)
    team_photo_url = Column(Text, nullable=True)
    monthly_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="ARS", nullable=False)
    alternative_amounts = Column(JSON, nullable=True)
    payment_method = Column(String(50), default="mercado_pago", nullable=False)
    mercado_pago_link = Column(String(500), nullable=True)
    raffle_prizes = Column(JSON, nullable=True)
    landing_slug = Column(String(255), nullable=True, unique=True)
    status = Column(String(50), default="draft", nullable=False, index=True)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_published = Column(DateTime(timezone=True), nullable=True)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'inactive')", name="check_campaign_status"),
    )


class FollowerModel(Base):
    __tablename__ = "followers"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    userprofile_id = Column(Integer, ForeignKey("userprofile.id", ondelete="SET NULL"), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive')", name="check_follower_status"),
    )


class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    userprofile_id = Column(Integer, ForeignKey("userprofile.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)


class AssistantModel(Base):
    __tablename__ = "assistants"
    
    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    rol = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    avatar = Column(String(500), nullable=True)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    date_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship
    functionalities = relationship("AssistantFunctionalityModel", back_populates="assistant", cascade="all, delete-orphan")


class AssistantFunctionalityModel(Base):
    __tablename__ = "assistant_functionalities"
    
    id = Column(Integer, primary_key=True, index=True)
    assistant_id = Column(String(50), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True)
    descripcion = Column(Text, nullable=False)
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship
    assistant = relationship("AssistantModel", back_populates="functionalities")


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assistant_id = Column(String(50), ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    sender = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("sender IN ('user', 'assistant')", name="check_chat_message_sender"),
    )

