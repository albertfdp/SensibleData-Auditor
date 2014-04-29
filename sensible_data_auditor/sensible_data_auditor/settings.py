import django_sensible.settings
import LOCAL_SETTINGS
import os

DEBUG = True
TEMPLATE_DEBUG = True

BASE_DIR = LOCAL_SETTINGS.BASE_DIR
DATABASES = LOCAL_SETTINGS.DATABASES
ROOT_DIR = LOCAL_SETTINGS.ROOT_DIR
ROOT_URL = LOCAL_SETTINGS.ROOT_URL
BASE_URL = LOCAL_SETTINGS.BASE_URL
APPLICATION_URL = LOCAL_SETTINGS.APPLICATION_URL

SENSIBLE_URL = LOCAL_SETTINGS.SENSIBLE_URL

SERVICE_URL = django_sensible.settings.SERVICE_URL
CONNECTOR = django_sensible.settings.CONNECTOR
SERVICE_TOKEN_URL = django_sensible.settings.SERVICE_TOKEN_URL
SERVICE_REFRESH_TOKEN_URL = django_sensible.settings.SERVICE_REFRESH_TOKEN_URL
SERVICE_MY_REDIRECT = SENSIBLE_URL+django_sensible.settings.IDP_MY_REDIRECT_SUFFIX
AUTH_ENDPOINT = django_sensible.settings.AUTH_ENDPOINT

#idp settings
IDP_URL = django_sensible.settings.IDP_URL
IDP_AUTHORIZATION_URL = django_sensible.settings.IDP_AUTHORIZATION_URL

SERVICE_MY_REDIRECT = SENSIBLE_URL + django_sensible.settings.SERVICE_MY_REDIRECT_SUFFIX
IDP_MY_REDIRECT = SENSIBLE_URL+django_sensible.settings.IDP_MY_REDIRECT_SUFFIX

LOGIN_URL = SENSIBLE_URL + django_sensible.settings.LOGIN_URL_SUFFIX
LOGIN_REDIRECT_URL = ROOT_URL
OPENID_SSO_SERVER_URL = django_sensible.settings.OPENID_SSO_SERVER_URL
OPENID_USE_EMAIL_FOR_USERNAME = django_sensible.settings.OPENID_USE_EMAIL_FOR_USERNAME
AUTHENTICATION_BACKENDS = django_sensible.settings.AUTHENTICATION_BACKENDS

OPENID_CREATE_USERS = django_sensible.settings.OPENID_CREATE_USERS
OPENID_UPDATE_DETAILS_FROM_SREG = django_sensible.settings.OPENID_UPDATE_DETAILS_FROM_SREG
OPENID_RENDER_FAILURE = django_sensible.settings.OPENID_RENDER_FAILURE

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # sensible
    'django_sensible',
    'bootstrap3'
)

INSTALLED_APPS += django_sensible.settings.INSTALLED_APPS

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    #'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'sensible_data_auditor.urls'

WSGI_APPLICATION = 'sensible_data_auditor.wsgi.application'


# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files
STATIC_ROOT = os.path.join(ROOT_DIR, 'static_root')
STATIC_URL = os.path.join(ROOT_URL, 'static/')

STATICFILES_DIRS = (
    os.path.join(ROOT_DIR, 'static'),
)

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    #'django.contrib.staticfiles.finders.DefaultStorageFinder', 
)

TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    #'django.template.loaders.eggs.Loader',
)

TEMPLATE_DIRS = (
    os.path.join(ROOT_DIR, 'templates'),
)

TEMPLATE_CONTEXT_PROCESSORS = (
    #'django.core.context_processors.i18n',
    'django.contrib.auth.context_processors.auth',
)

ROOT_URLCONF = 'sensible_data_auditor.urls'

WSGI_APPLICATION = 'sensible_data_auditor.wsgi.application'

SECRET_KEY = LOCAL_SETTINGS.SECRET_KEY
