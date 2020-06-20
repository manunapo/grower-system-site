
var GrowerSystem = window.GrowerSystem || {};
GrowerSystem.map = GrowerSystem.map || {};



(function dashScopeWrapper($) {
   
    $(function onDocReady() {
	

		GrowerSystem.authToken.then(function updateAuthMessage(token) {
			if (token) {
				
                $('#signButtonDiv').append('<a style="color:white">You are logged in</a>');
			
			}else{
				
			}
		});
        
        
        $("#sign-out").click(function (){
			GrowerSystem.signOut();
			window.location.href = './signin.html';
        });
        // $(this).remove();
    });
    
}(jQuery));

