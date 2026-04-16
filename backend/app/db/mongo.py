from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorDatabase


def get_database(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongo_db


def get_items_collection(request: Request):
    return get_database(request)["items"]