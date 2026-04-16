from contextlib import asynccontextmanager

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, IndexModel
from redis.asyncio import Redis

from backend.app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    mongo_client = AsyncIOMotorClient(settings.mongodb_url)
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    database = mongo_client[settings.mongodb_db]

    await database["users"].create_indexes([
        IndexModel([("email", ASCENDING)], unique=True, name="uniq_email"),
    ])
    await database["organizations"].create_indexes([
        IndexModel([("owner_user_id", ASCENDING)], unique=True, name="uniq_owner_user_id"),
    ])
    await database["invitations"].create_indexes([
        IndexModel([("token_hash", ASCENDING)], unique=True, name="uniq_invite_token_hash"),
        IndexModel([("email", ASCENDING), ("status", ASCENDING)], name="invite_email_status"),
        IndexModel([("expires_at", ASCENDING)], name="invite_expires_at"),
    ])
    await database["forms"].create_indexes([
        IndexModel([("organization_id", ASCENDING), ("slug", ASCENDING)], unique=True, name="uniq_form_slug_per_org"),
        IndexModel([("organization_id", ASCENDING), ("created_at", ASCENDING)], name="forms_org_created_at"),
    ])
    await database["form_versions"].create_indexes([
        IndexModel([("form_id", ASCENDING), ("version", ASCENDING)], unique=True, name="uniq_form_version"),
    ])
    await database["users"].create_indexes([
        IndexModel([("google_sub", ASCENDING)], unique=True, sparse=True, name="uniq_google_sub"),
    ])

    app.state.mongo_client = mongo_client
    app.state.mongo_db = database
    app.state.redis = redis_client

    try:
        yield
    finally:
        await redis_client.aclose()
        mongo_client.close()