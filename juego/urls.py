from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    (r'^index/$', 'juego.views.index'),
    (r'^juego/$', 'game.views.game')
    # Examples:
    # url(r'^$', 'juego.views.home', name='home'),
    # url(r'^juego/', include('juego.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
