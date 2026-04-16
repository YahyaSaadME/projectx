from fastapi import Request
from motor.motor_asyncio import AsyncIOMotorDatabase


def get_database(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongo_db


def get_items_collection(request: Request):
    return get_database(request)["items"]


def get_users_collection(request: Request):
    return get_database(request)["users"]


def get_organizations_collection(request: Request):
    return get_database(request)["organizations"]


def get_invitations_collection(request: Request):
    return get_database(request)["invitations"]


def get_forms_collection(request: Request):
    return get_database(request)["forms"]


def get_form_versions_collection(request: Request):
    return get_database(request)["form_versions"]