from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^dashboard/', 'auditor_viewer.views.dashboard', name='dashboard'),
    url(r'^about/', 'auditor_viewer.views.about', name='about'),
	url(r'^', 'auditor_viewer.views.home', name='home'),
)
