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


	// 1 = 24hs; 2 = 1w; 3 = 1m
	var samplingPeriod = 1;

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


				drawCharts();


			} else {
				logInButtonText = "Sign Out";
			}
		});

		$("#sign-out").click(function () {
			GrowerSystem.signOut();
			window.location.href = './signin.html';
		});

		$("#btn24").click(function () {
			samplingPeriod = 1;
			$("#btn24").addClass("active");
			$("#btn1w").removeClass("active");
			$("#btn1m").removeClass("active");
			drawCharts();
		});

		$("#btn1w").click(function () {
			samplingPeriod = 2;
			$("#btn1w").addClass("active");
			$("#btn24").removeClass("active");
			$("#btn1m").removeClass("active");
			drawCharts();
		});

		$("#btn1m").click(function () {
			samplingPeriod = 3;
			$("#btn1m").addClass("active");
			$("#btn1w").removeClass("active");
			$("#btn24").removeClass("active");
			drawCharts();
		});

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



	

	function drawCharts() {

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
						type: 'linear', 
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
						type: 'linear',
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
						type: 'linear', 
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
						type: 'linear',
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

		AWS.config.credentials.get(function (err) {
			if (err) {
				alert(err);
			}
		});


		AWS.config.region = 'sa-east-1';
		var docClient = new AWS.DynamoDB.DocumentClient();

		var fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24;
		var toValue = new Date().valueOf()
		if( samplingPeriod == 2){
			fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24 * 7;
		}
		if( samplingPeriod == 3){
			fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24 * 30;
		}

		let params2 = {
			TableName: "Measurements",
			KeyConditionExpression: "#ID = :ID and TimeEpoch between :time1 and :time2",
			ScanIndexForward: true,
			ExpressionAttributeNames: {
				"#ID": "ID"
			},
			ExpressionAttributeValues: {
				":ID": "data",
				":time1": fromValue,
				":time2": toValue
			}
		};

		docClient.query(params2, function (err, data) {
			if (err) {
				console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			} else {
				let tempValuesBomb = [];
				data.Items.forEach(function (measure) {

					let value1 = measure.ground_moisure;
					let value2 = measure.air_moisure;
					let value3 = measure.air_temperature;
					let values = [value1, value2];
					let values2 = [value3];

					let time = (new Date(measure.TimeEpoch)).getHours() + ':' + (new Date(measure.TimeEpoch)).getMinutes();
					addData(myChart1, time, 2, values);
					addData(myChart2, time, 1, values2);

					handleWaterChart(myChart3, measure.TimeEpoch, tempValuesBomb, measure.bomb);
				});
				tempValuesBomb.forEach( function (element) {
					addData(myChart3, element.timeLastWatering, 1, element.amountOfWater);
				});
			}
		});

		feather.replace();

	}

	function addData(chart, time, cantData, data) {
		
		chart.data.labels.push(time);
		for (var i = 0; i < cantData; i++) {
			chart.data.datasets[i].data.push(data[i]);
		}
		chart.update();
	}


	function handleWaterChart(chart, epoch, tempValuesBomb, measure) {
		// moisure.bomb = 14:34:05 d:0 a:5
		let date = (new Date(epoch)).getDate();
		let timeLastWatering = "" + measure.charAt(0) + "" + measure.charAt(1) + ":" + measure.charAt(6) + "" + measure.charAt(7);
		let amountOfWater = measure.charAt(15);
		let dayOfLastWatering = measure.charAt(11);
		if( !(dayOfLastWatering in tempValuesBomb)){
			tempValuesBomb[dayOfLastWatering] = { timeLastWatering, amountOfWater};
		}
	}


}(jQuery));

