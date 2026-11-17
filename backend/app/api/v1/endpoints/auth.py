from fastapi import APIRouter, Depends, Request, Response, status

from app.core.config import settings
from app.dependencies.auth import get_auth_service, get_current_user
from app.schemas.auth import LoginRequest, MessageResponse, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=refresh_token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE.lower(),  # type: ignore
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/api/v1/auth",
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE.lower(),  # type: ignore
    )


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new candidate account",
)
async def register(
    data: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserRead:
    return await auth_service.register(
        name=data.name,
        email=data.email,
        password=data.password,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate candidate and issue tokens",
)
async def login(
    data: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    access_token, refresh_token, expires_in, user = await auth_service.login(
        email=data.email,
        password=data.password,
    )
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Renew access token using rotated refresh cookie",
)
async def refresh(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    refresh_token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    access_token, new_refresh_token, expires_in, user = await auth_service.refresh_tokens(
        raw_refresh_token=refresh_token or ""
    )
    _set_refresh_cookie(response, new_refresh_token)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=user,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke refresh session and clear cookie",
)
async def logout(
    request: Request,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    refresh_token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    await auth_service.logout(refresh_token)
    _clear_refresh_cookie(response)
    return MessageResponse(message="Successfully logged out")


@router.get(
    "/me",
    response_model=UserRead,
    status_code=status.HTTP_200_OK,
    summary="Get currently authenticated candidate profile",
)
async def get_me(
    current_user: UserRead = Depends(get_current_user),
) -> UserRead:
    return current_user

