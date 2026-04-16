from contextlib import asynccontextmanager

from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis

from backend.app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    mongo_client = AsyncIOMotorClient(settings.mongodb_url)
    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)

    app.state.mongo_client = mongo_client
    app.state.mongo_db = mongo_client[settings.mongodb_db]
    app.state.redis = redis_client

    try:
        yield
    finally:
        await redis_client.aclose()
        mongo_client.close()