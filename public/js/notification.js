// notifications //

var lastSeen = 1;
var cb = function(p){
  lastSeen = p;
}

$.ajax({
  url:"/api/user/notifications"
}).done(function(data){

  if (data.success){
     
    // if there is a new record, show the badge 
    if (parseInt(data.last_seen) > parseInt(readCookie('last_notify')) ){
      $('.button-badge').show(); 
    }
    //pass data in to callback so it can set lastSeen var
    cb(data.last_seen); 
    
    var container = $('<ul>');
    for (var i in data.notifications){
      var li = $('<li>');
      li.text(data.notifications[i].message);
      li.append('<br>');
      li.append('on ' + moment(data.notifications[i].date).format("M/D [at] h:mm a"));
      container.append(li);
    }
    $('nav.topnav .dropdown').html(container);
    
  } else if (data.error == 'no results'){
    $('nav.topnav .dropdown').html('<li>No new notifications</li>');
  }
});

$('.alertbell').on('mousedown',null, lastSeen, function(e){
    $('nav.topnav .dropdown').toggle();
    $('.button-badge').hide();
    // set cookie
    createCookie('last_notify',lastSeen,30);
});

// hide alerts when clicked elsewhere
$(document).on('click',function(e){
  if ($('nav.topnav .dropdown').is(':visible') 
    && !$(e.target).hasClass('dropdown')
    && !$(e.target).hasClass('fa-bell')){
      $('nav.topnav .dropdown').hide();
  }
});


function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}