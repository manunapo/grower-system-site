/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};



(function dashScopeWrapper($) {
    var authToken;
    WildRydes.authToken.then(function setAuthToken(token) {
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
		//$(WildRydes.map).on('pickupChange', handlePickupChanged);

		WildRydes.authToken.then(function updateAuthMessage(token) {
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
				
			}
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

	

	function addData(chart, label, data) {
		chart.data.labels.push(label);
		chart.data.datasets[0].data.push(data[0]);
		chart.data.datasets[1].data.push(data[1]);
		chart.update();
	}

	function removeData(chart) {
		chart.data.labels.pop();
		chart.data.datasets.forEach((dataset) => {
			dataset.data.pop();
		});
		chart.update();
	}

	function getData() {

		// Graphs
		var ctx = document.getElementById('myChart')
		// eslint-disable-next-line no-unused-vars

		var myChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'My First dataset',
					borderColor: window.chartColors.red,
					backgroundColor: window.chartColors.red,
					fill: false,
					data: [],
					yAxisID: 'y-axis-1',
				}, {
					label: 'My Second dataset',
					borderColor: window.chartColors.blue,
					backgroundColor: window.chartColors.blue,
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
				display: false
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
				
				var time = measure.Time['S'];
				var value1 = measure.ground_moisure['N'];
				var value2 = measure.air_moisure['N'];
				var values = [value1,value2];
				addData(myChart, time, values);
			})
		  }
		});

		feather.replace()

		
		
	}

	
	
	// $(function() {
	// 	getData();
	// 	$.ajaxSetup({ cache: false });
	// 	setInterval(getData, 3000);
	//   });

}(jQuery));

