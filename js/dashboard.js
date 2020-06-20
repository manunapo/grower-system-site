/*global GrowerSystem _config*/

var GrowerSystem = window.GrowerSystem || {};
GrowerSystem.map = GrowerSystem.map || {};



(function dashScopeWrapper($) {
    var authToken;
    GrowerSystem.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = './signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = './signin.html';
    });

	
	// Register click handler for #request button
	$(function onDocReady() {
		//$('#request').click(handleRequestClick);
		//$(GrowerSystem.map).on('pickupChange', handlePickupChanged);

		var logInButtonText = "Signasas in";

		GrowerSystem.authToken.then(function updateAuthMessage(token) {
			if (token) {
				//displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
				$('.authToken').text(token);
				//$('#toPopu').append("<tr><td>2</td><td>Thomas</td></tr>");
			
				AWS.config.region = 'us-east-1';
				AWS.config.credentials = new AWS.CognitoIdentityCredentials({
					IdentityPoolId: 'us-east-1:e450af87-3eae-4979-9cc6-d1fe3a7bcfbd',
					Logins: {
						'cognito-idp.us-east-1.amazonaws.com/us-east-1_lMnOeamMs': token
					}
					
				});
				
				
				getData();
			

			}else{
				logInButtonText = "Sign Out";
			}
		});
		
		$("#sign-out").click(function (){
			GrowerSystem.signOut();
			window.location.href = './signin.html';
		});

		if (!_config.api.invokeUrl) {
			$('#noApiMessage').show();
		}

		
	});


	window.chartColors = {
		red: 'rgb(255, 99, 132)',
		orange: 'rgb(255, 159, 64)',
		yellow: 'rgb(255, 205, 86)',
		green: 'rgb(75, 192, 192)',
		blue: 'rgb(54, 162, 235)',
		purple: 'rgb(153, 102, 255)',
		grey: 'rgb(201, 203, 207)'
	};

	

	function addData(chart, label, cantData, data) {
		chart.data.labels.push(label);
		for(var i = 0; i < cantData; i++){
			chart.data.datasets[i].data.push(data[i]);
		}
		chart.update();
	}

	function getData() {

		var ctx1 = document.getElementById('myChart1')
		var ctx2 = document.getElementById('myChart2')
		var ctx3 = document.getElementById('myChart3')
		var ctx4 = document.getElementById('myChart4')
		

		var myChart1 = new Chart(ctx1, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'Ground Moisure',
					borderColor: window.chartColors.green,
					backgroundColor: window.chartColors.green,
					fill: false,
					data: [],
					yAxisID: 'y-axis-1',
				}, {
					label: 'Air Moisure',
					borderColor: window.chartColors.red,
					backgroundColor: window.chartColors.red,
					fill: false,
					data: [],
					yAxisID: 'y-axis-1'
				}]
			},
			options: {
				scales: {
					yAxes: [{
						type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
						display: true,
						position: 'left',
						id: 'y-axis-1',
					}],
				},
				legend: {
					display: true,
					position: 'top'
				}
			}
		});

		var myChart2 = new Chart(ctx2, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'Air Temperature',
					borderColor: window.chartColors.grey,
					backgroundColor: window.chartColors.grey,
					fill: false,
					data: [],
					yAxisID: 'y-axis-1',
				}]
			},
			options: {
				scales: {
					yAxes: [{
						type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
						display: true,
						position: 'left',
						id: 'y-axis-1',
					}],
				},
				legend: {
					display: true,
					position: 'top'
				}
			}
		});

		var myChart3 = new Chart(ctx3, {
			type: 'bar',
			data: {
				labels: [],
				datasets: [{
					label: 'Water',
					borderColor: window.chartColors.blue,
					backgroundColor: window.chartColors.blue,
					fill: false,
					data: [],
					yAxisID: 'y-axis-1',
				}]
			},
			options: {
				scales: {
					yAxes: [{
						type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
						display: true,
						position: 'left',
						id: 'y-axis-1',
					}],
				},
				legend: {
					display: true,
					position: 'top'
				}
			}
		});

		var myChart4 = new Chart(ctx4, {
			type: 'bar',
			data: {
				labels: [],
				datasets: [{
					label: 'Future Use',
					borderColor: window.chartColors.blue,
					backgroundColor: window.chartColors.blue,
					fill: false,
					data: [],
					yAxisID: 'y-axis-1',
				}]
			},
			options: {
				scales: {
					yAxes: [{
						type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
						display: true,
						position: 'left',
						id: 'y-axis-1',
					}],
				},
				legend: {
					display: true,
					position: 'top'
				}
			}
		});

		AWS.config.credentials.get(function(err){
			if (err) {
				alert(err);
			}
		});

		AWS.config.region = 'sa-east-1'; 
		var dynamodb = new AWS.DynamoDB();
		var params = {	TableName: 'Measurements'}

		// var params = { 
		// 	TableName: 'Measurements',
		// 	FilterExpression: '#types = :val OR #types = :val2',
		// 	ExpressionAttributeValues: {
		// 		":val" : {'S' : "ground_moisure"},
		// 		":val2" : {'S' : "air_moisure"}
		// 	},
		// 	ExpressionAttributeNames: {
		// 		"#types": "Type"
		// 	}
		// };

		dynamodb.scan(params, function(err, data) {
		  if (err) {
			console.log(err);
			return null;
		  } else {
			data.Items.forEach(function(measure) {
				
				var time = formatTime(measure.TimeEpoch['N']);
				var value1 = measure.ground_moisure['N'];
				var value2 = measure.air_moisure['N'];
				var value3 = measure.air_temperature['N'];
				var values = [value1,value2];
				var values2 = [value3];
				addData(myChart1, time, 2, values);
				addData(myChart2, time, 1, values2);
				addData(myChart3, 15, 1, [5]);
			})
		  }
		});

		feather.replace()

		
		
	}

	function formatTime( time){
		//in=   15/Jun/2020:22:26:09 +0000
		//out=  
		var date = new Date(time*1);
		return date.getHours() + ':' + date.getMinutes();
	}
	
}(jQuery));

