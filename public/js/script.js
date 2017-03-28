if (typeof validate !== 'undefined'){

  validate.validators.usernameIsUnique = function(value) {
    return new validate.Promise(function(resolve, reject) {
        $.ajax({
          url: "/api/user/exists?u="+value
        }).done(function(data){
          if (data.success === true){
            console.log('user exists -- ajax');
            resolve('already exists');
          } else {
            resolve();
            console.log('user does not exist -- ajax');
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

  // Confirm password not working with validate.js. Doing it by hand
  $('input[name="password_confirm"]').blur(function(){
    if (this.value === $('input[name="password"]')[0].value){
      console.log('passwords match');
      //$(this).parent().next().text('');
      $(this).parent().parent().find('.field-validation.password_confirm').text('');
    } else {
      console.log('no match');
      //console.log($('input[name="password"]')[0].value);
      //$(this).parent().next().text('Passwords do not match');
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
            ///if (field != 'password_confirm'){
              msg += fieldNames[field] + ' ';
            //}
            msg += v[0];
            //$(this).parent().next().text(msg);
            $(this).parent().parent().find('.field-validation.'+field).text(msg);
          } else {
            //$(this).parent().next().text('');
            $(this).parent().parent().find('.field-validation.'+field).text('');
          }
        }   
        
    });
  } // end for

} // end if validate

// one last check on submit
$('#signup').on('submit', function(e){
    e.preventDefault();
    var formValues = validate.collectFormValues(form);
    var result = validate(formValues,constraints);
    console.log(result);
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

/* message board */

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
  
})

$('#editmodal a.close').on('click',function(e){
    e.preventDefault();
    $('#editmodal').css('display','none');
});

$('#editmodal button').on('click',function(e){
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

// message upload form
$('#photo-upload').on('change',function(){
  if (this.files[0].size/1000000 > 4){
    alert('That file is too large. Please choose a file less than 4MB');
  }
});

// load dashboard widgets
if ( $('.dashboard').length > 0){
  //console.log('dashboard');
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
      $('#info3').append(content);
    }
  });
}



