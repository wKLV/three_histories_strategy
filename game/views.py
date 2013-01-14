# Create your views here.
from django.template import Context, loader
from django.core.context_processors import csrf
from django.http import HttpResponse

def game(request):
    c = Context({})
    c.update(csrf(request))
    return HttpResponse(loader.get_template('juego.html').render(c))