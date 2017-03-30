$('#user-activate').on('click',function(){
	var checkboxes = $('input[name="userid"]');
	var users = [];
	for (var i in checkboxes){
		if (checkboxes[i].checked){
			users.push(parseInt($(checkboxes[i]).val()));
		}
	}

	if (users.length > 0){
		$.ajax({
			method: 'POST',
        	url: "/admin/users/activate",
        	data: { userids: users}
        })
        .done(function(data){
        	console.log(data);
        	if (data.ok){
        		// reload
        		window.location.reload(true);
        	} else {
        		// show error
        		alert('There was an error updating the users');
        	}
        })
	} else {
		alert("Please select some users");
	}
});

$('.bestow form #receiver').on('blur', function(){
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