if ($('table.transactions').length > 0){
	$('.note-icon').on('click',function(e){
		var note_id = this.id.split('-')[1];
		$('#note-'+note_id).toggle();
		
		if ($(this).parent().parent().hasClass('opened')){
			$(this).parent().parent().removeClass('opened');
		} else {
			$(this).parent().parent().addClass('opened');
		}
		
		
	})
}

if ($('.sendtokens').length > 0 ){
	$('.sendtokens form').on('submit',function(e){
	    e.preventDefault();
	    if ( $('#amt').val().length < 1){
	      alert("Please enter an amount of tokens to send");
	      return false;
	    } 
	    if  ( $('input[name="receiver"]').val().length < 3){
	      alert("The receiver username is not valid");
	      return false;
	    }
	    this.submit();
	});
}

/* -- validation -- */

if (typeof validate !== 'undefined'){

  validate.validators.usernameIsUnique = function(value) {
  	console.log('usernameIsUnique');
    return new validate.Promise(function(resolve, reject) {
        $.ajax({
          method: 'POST',
          url: "/api/user/" + value + "/exists"
        }).done(function(data){
        	console.log(data);
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
