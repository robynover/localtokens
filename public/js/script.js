if (typeof validate !== 'undefined'){

  validate.validators.usernameIsUnique = function(value) {
    return new validate.Promise(function(resolve, reject) {
        $.ajax({
          url: "/api/user/exists?u="+value
        }).done(function(data){
          if (data.success === true){
            resolve('already exists');
          } else {
            resolve();
          }
        });
    });
  };


  var constraints = {
    username: {
      presence: true,
      length: {minimum: 3,maximum: 20},
      format: {
        pattern: "[a-z0-9]+",
        flags: "i",
        message: "can only contain a-z and 0-9"
      }
    },
    password: {
      presence: true,
      length: {
        minimum: 6,
        message: "must be at least 6 characters"
      }
    },
    email: {
      email: true
    },
    firstname:{
      presence: true
    }
  };

  // username gets processed separately onblur
  var usernameConstraints = {
    username: {
      presence: true,
      length: {minimum: 3,maximum: 20},
      usernameIsUnique: true,
      format: {
        pattern: "[a-z0-9]+",
        flags: "i",
        message: "can only contain a-z and 0-9"
      }
    }
  };

  var success = function(){
    $('.field-validation.username').text('');
  };
  var error = function(errors){
    var msg = '';
    if (typeof errors == 'object'){
      msg = errors.username[0];
    } else {
      msg = errors[0];
    }
    $('.field-validation.username').text(msg);
  };

  // special validation for username
  //   checks if user already exists
  $('input[name="username"]').blur(function(){
    validate.async({username:this.value}, usernameConstraints).then(success,error);
  });

  // Confirm-password not working with validate.js. Doing it by hand
  $('input[name="password_confirm"]').blur(function(){
    if (this.value === $('input[name="password"]')[0].value){
      $(this).parent().parent().find('.field-validation.password_confirm').text('');
    } else {
      $(this).parent().parent().find('.field-validation.password_confirm').text('Passwords do not match');
    }
  });

  var form = $('#signup');
  var formValues = validate.collectFormValues(form);

  var fieldNames = {
    'username': 'Username',
    'firstname': 'First Name',
    'lastname': 'Last Name',
    'email': 'Email',
    'password': 'Password'
  }
  // validation for all other inputs 
  for(var field in formValues){
    // username has its own function for validation -- exclude it
    if (field == 'username'){
      continue;
    }
    $('input[name="'+field+'"]').blur(function(){
        var field = this.name;  
        if (constraints[field]){
          var v = validate.single(this.value, constraints[field]);
          if (v){
            var msg = '';
            msg += fieldNames[field] + ' ';
            msg += v[0];
            
            $(this).parent().parent().find('.field-validation.'+field).text(msg);
          } else {    
            $(this).parent().parent().find('.field-validation.'+field).text('');
          }
        }   
        
    });
  } // end for

  // one last check on submit
  $('#signup').on('submit', function(e){
      e.preventDefault();
      var formValues = validate.collectFormValues(form);
      var result = validate(formValues,constraints);
      if (typeof result === 'object'){
        // there are errors
        var msg = '';
        for (var field in result){
          msg += result[field] + ' ';
        }
        $('.field-validation.submit').text(msg);
      } else {
        // no errors. submit
        this.submit();
      }
  });

} // end if validate


/* message board */
if ($('.messageboard').length > 0){

  $('.tools .edit').on('click',function(e){
    e.preventDefault();
    //console.log('edit click');
    $('#editmodal').css('display','block');
    var id = this.id.split('-')[1];

    // store id in hidden input for later
    $('#editmodal input[type="hidden"]').val(id);
    console.log(id);
    
    var wrapper = $('#wrap-'+id);
    var body = wrapper.find('.postbody').html();
    $('#editmodal textarea').text(body);
    
    var title = wrapper.find('h2').text();
    $('#editmodal input[type="text"]').val(title);
    
  });

  $('.tools .delete').on('click',function(e){
    e.preventDefault();
    var reallyDelete = confirm("Really delete this post?");
    if( reallyDelete ){
      var id = this.id.split('-')[1];
      $.ajax({
        method: "POST",
        url: "/messageboard/post/delete/"+id
      })
        .done(function( msg ) {
          var url = window.location.href;
          var domainAndPort = url.split('/')[2];
          window.location.replace('http://' + domainAndPort + "/messageboard?del=1");
        });
    }
    
  });

  $('.messageboard #editmodal button').on('click',function(e){
      e.preventDefault();
      var title = $('#editmodal input[type="text"]').val();
      var message = $('#editmodal textarea').val();
      
      var id = $('#editmodal input[type="hidden"]').val();
      
      $.ajax({
        method: "POST",
        url: "/messageboard/post/edit/"+id,
        data: { title: title, message: message}
      })
        .done(function( msg ) {
          //console.log(msg);
          var wrapper = $('#wrap-'+id);
          // update page w/o reloaing
          wrapper.find('.postbody').html(message);
          // close modal
          $('#editmodal').css('display','none');
          
        });
  });

  $('#new-msg-form').on('submit', function(e){
    e.preventDefault();
    if ($('#new-msg-form .msgtitle').val().length < 1){
      alert('Title cannot be empty');
      return false;
    }else if ($('#new-msg-form .msgbody').val().length < 1){
      alert('Post body cannot be empty');
      return false;
    }  
    this.submit();
  });

  // message upload form
  $('#photo-upload').on('change',function(){
    if (this.files[0].size/1000000 > 4){
      alert('That file is too large. Please choose a file less than 4MB');
    }
  });

} // end if messageboard

//edit modal -- used for message board and profile
$('#editmodal a.close').on('click',function(e){
    e.preventDefault();
    $('#editmodal').css('display','none');
});

/* send tokens */
if ($('.sendtokens').length > 0){
  $('.sendtokens form #receiver').on('blur', function(){
    var receiver = $(this).val();
    $.ajax({
      method: "GET",
      url: "/api/user/exists?u="+receiver,
    }).done(function( json ) {
        if(json.error){
          $('.field-validation.receiver').removeClass('success');
          $('.field-validation.receiver').addClass('error');
          $('.field-validation.receiver').text(json.error);
        } else if (json.success) {
           $('.field-validation.receiver').removeClass('error');
          $('.field-validation.receiver').addClass('success')
          $('.field-validation.receiver').text('user found');

        }
    });
  });

  $('.sendtokens form').on('submit',function(e){
    e.preventDefault();
    if ( $('#amt').val().length < 1){
      alert("Please enter an amount of tokens to send");
      return false;
    } 
    if  ( $('#receiver').val().length < 3){
      alert("The receiver username is not valid");
      return false;
    }
    this.submit();
  });
} // end if send tokens

// load dashboard widgets
if ( $('.dashboard').length > 0){
  // recent posts
  $.ajax({
    url: "/api/posts/recent"
  }).done(function(data){
    if (data.success){
      var content = $('<ul></ul>');
      // /messageboard/post/view/58da780bcb84f96108ddc158
      for (var i in data.records){
        var r = data.records[i];
        var li = $('<li><a href="/messageboard/post/view/'+r._id+'">'+r.title+'</a></li>');
        content.append(li);
      }
      $('#info3 .dashboard-posts').append(content);
    }
  });

  // number of transactions
  $.ajax({
    url: "/api/user/transactions/count"
  }).done(function(data){
    //console.log(data);
    if (data){
      $('.numtrans').text(data.count);
      if (data.count == 1){
        $('.tword').text('transaction');
      }
    }
  });

  // num ppl transacted with
  $.ajax({
    url: "/api/user/transactions/people"
  }).done(function(data){
    //console.log(data);
    if (data){
      $('.numppl').text(data.count);
      if (data.count == 1){
        $('.pword').text('person');
      }
    }
  });

}

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

/* user profile */
if($('.profile').length > 0){
  var user_id = $('.profile-text').attr('id');
  var username = $('.profile').attr('id');
  var deleteBtn = '&nbsp;<a href="#" class="del"><i class="fa fa-times" aria-hidden="true"></i></a>';

  // load photo
  var loadProfilePhoto = function(){
    $.ajax({
      url:'/api/user/' + user_id +'/photo',
      method: 'GET'
    }).done(function(data){
      if (data.success){
        //load photo
        $('#profile-photo').attr('src',data.photo);
      }
    });
  }
  loadProfilePhoto();

  $.ajax({
    url: '/api/user/' + username + '/offering'
  })
    .done(function(data){
      if (data.success){
        data.items.forEach(function(it){
          $('ul.offering').append('<li id="item-'+it.id+'">' + it.description + deleteBtn + '</li>');
          
        });
        registerDeleteBtn('offering');
      }
    });

    $.ajax({
      url: '/api/user/' + username + '/seeking'
    })
      .done(function(data){
        if (data.success){
          data.items.forEach(function(it){
            $('ul.seeking').append('<li id="item-'+it.id+'">' + it.description + deleteBtn + '</li>');
            
          });
          registerDeleteBtn('seeking');
        }
      });

    function addItem(type,item){
        $.ajax({
          url: '/api/user/item/add',
          method: 'POST',
          data: { type: type, description: item}
        }).done(function(data){
          if (data.success){
            $('ul.'+type).append('<li id=item-'+data.id+'>' + item + deleteBtn + '</li>');
            $('#'+type).parent().find('input').val('');
          } else {
            console.log('could not add item');
          }
        });
    }

    $('.add-item a').on('click',function(e){
      e.preventDefault();
      var type = this.id;
      var item = $(this).parent().find('input').val();
      addItem(type,item)
      
    });

    // allow adding items with enter key
    $('.add-item input').on('keyup',function(e){
      if(e.keyCode == 13){ //enter
        var type = $(this).parent().find('a').attr('id');
        var item = $(this).val();
        addItem(type,item);
      }
    })

    var registerDeleteBtn = function(ulclass){
      $('.' + ulclass ).on('click','a.del',function(e){
        e.preventDefault();
        console.log($(this).parent().attr('id'));
        var id = $(this).parent().attr('id').split('-')[1];
        var li = $(this).parent();
        console.log(id);
        $.ajax({
          method: "POST",
          url: '/api/item/' + id + '/delete'
        }).done(function(data){
          if (data.success){
            li.remove();
          } else {
            console.log(data);
          }
        })

      });
    };

    // fill in profile
    
    $.ajax({
      url: '/api/user/' + user_id + '/profile'
    }).done(function(data){
      if (data.success){
        $('.profile-text').html(data.profile);
      } else {
        $('.profile-text').html('');
      }
    })

    $('.edit-profile i').on('click',function(e){
      e.preventDefault();
      $('#editmodal').css('display','block');
      var txt = $('.profile-text').html();
      $('#editmodal textarea').text(txt);
    });

    $('.profile #editmodal button').on('click',function(e){
        e.preventDefault();
        var txt = $('#editmodal textarea').val();
        $.ajax({
          url: '/api/user/profile/edit',
          method: 'POST',
          data: { profile_text: txt }
        }).done(function(data){
          if (data.success){
            $('#editmodal').css('display','none');
            $('.profile-text').html(txt);
          }

        });
    });

    // profile photo upload
    $('#user-photo-upload button').on('click',function(e){
        e.preventDefault();
        // start spinner
        $(this).html('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i>');
        var data = new FormData();
        var file = $('#user-photo-file').get(0).files[0];
        data.append('photo',file);
        //console.log(file);
        
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function(event){
            //console.log(event);
            var result = event.target.result;
            var fileName = file.name; 
            //console.log(result);
            $.ajax({
                url:'/api/user/photo',
                method:'POST',
                contentType: false,
                processData: false,
                data: data
            }).done(function(data){
                //console.log(data);
                loadProfilePhoto();
                $('#user-photo-upload').hide();
                //remove spinner
                $('#user-photo-upload button').html('Upload');
            })
        };
    });

    //toggle photo upload form
    $('.edit-photo i.fa-pencil').on('click',function(){
      $('#user-photo-upload').toggle();
    })
  
}

/*ledger notes*/
$('table.transactions').on('click','.note-icon',function(){
  //show note
  var id = this.id.split('-')[1];
  $('#note-'+id).toggle();

  
});

// listen for click elsewhere
if ($('table.transactions').length > 0){
  $(document).on('click',function(e){
    if ($('.noteview').is(':visible') && !$(e.target).hasClass('note-icon')){
      $('.noteview').hide();
    }
  });
}




