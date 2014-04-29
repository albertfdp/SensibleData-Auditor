from django.shortcuts import render
from django.shortcuts import render_to_response
from django.template import RequestContext

def home(request):
    return render_to_response('home.html', {}, context_instance=RequestContext(request))

def dashboard(request):
    return render_to_response('dashboard.html', {}, context_instance=RequestContext(request))

def about(request):
    return render_to_response('about.html', {}, context_instance=RequestContext(request))
