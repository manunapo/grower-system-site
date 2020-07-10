/*global GrowerSystem _config*/


var GrowerSystem = window.GrowerSystem || {};
GrowerSystem.map = GrowerSystem.map || {};



(function dashScopeWrapper($) {
	var authToken;
	GrowerSystem.authToken.then(function setAuthToken(token) {
		if (token) {
			authToken = token;
		} else {
			window.location.href = './login.html';
		}
	}).catch(function handleTokenError(error) {
		alert(error);
		window.location.href = './login.html';
	});

	// 1 = 24hs; 2 = 1w; 3 = 1m
	var samplingPeriod = 1;


	$(function onDocReady() {

		GrowerSystem.authToken.then(function updateAuthMessage(token) {
			if (token) {
				$('.authToken').text(token);

				AWS.config.region = 'us-east-1';
				AWS.config.credentials = new AWS.CognitoIdentityCredentials({
					IdentityPoolId: 'us-east-1:e450af87-3eae-4979-9cc6-d1fe3a7bcfbd',
					Logins: {
						'cognito-idp.us-east-1.amazonaws.com/us-east-1_lMnOeamMs': token
					}

				});

				$("#idName").text(parseJwt(token).email);
				updateActionList();
			} else {
			}
		});

		function parseJwt(token) {
			var base64Url = token.split('.')[1];
			var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));

			return JSON.parse(jsonPayload);
		};


		$("#idImage").css("background-image", "url(https://s3.amazonaws.com/uifaces/faces/twitter/_everaldo/128.jpg)");

		$("#sign-out").click(function () {
			GrowerSystem.signOut();
			window.location.href = './login.html';
		});

		$("#lightButttonOn").click(function () {
			let action = '{"light":"on"}';
			sendAction(action);
		});

		$("#fanButttonOn").click(function () {
			let action = '{"fan":"on"}';
			sendAction(action);
		});

		$("#lightButttonOff").click(function () {
			let action = '{"light":"off"}';
			sendAction(action);
		});

		$("#fanButttonOff").click(function () {
			let action = '{"fan":"off"}';
			sendAction(action);
		});

		$("#bombButtton").click(function () {
			let action = '{"bomb":"on"}';
			sendAction(action);
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

		$(function () {
			if (!$("#dashboard-humidity-chart").length)
				return !1;
			a();
			var o = null
				, t = "humidity";
			function r(e) {
				var o = "#dashboard-" + e + "-chart";
				switch ($(o).has("svg").length && $(o).empty(),
				e) {
					case "humidity":
						a();
						break;
					case "temperature":
						let temperature = Morris.Line({
							element: "dashboard-temperature-chart",
							xkey: "x",
							ykeys: ["y"],
							//ymin: "auto 40",
							labels: ["Temperature"],
							xLabels: "hour",
							hideHover: "auto",
							yLabelFormat: function (e) {
								return e;
							},
							resize: !0,
							lineColors: [config.chart.colorSecondary.toString()],
							pointSize: 0,
							pointFillColors: [config.chart.colorPrimary.toString()]
						})
						updateCharts(temperature, 2);

				}
			}
			function a() {
				let humidity = Morris.Line({
					element: "dashboard-humidity-chart",
					xkey: "x",
					ykeys: ["y"],
					//ymin: "auto 40",
					labels: ["Humidity"],
					xLabels: "hour",
					hideHover: "auto",
					yLabelFormat: function (e) {
						return e === parseInt(e, 10) ? e : ""
					},
					resize: !0,
					lineColors: [config.chart.colorSecondary.toString()],
					pointSize: 0,
					pointFillColors: [config.chart.colorPrimary.toString()]
				})
				updateCharts(humidity, 1);
			}
			$('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
				o = e.target,
					r(t = $(o).attr("href").replace("#", ""))
			}),
				$(document).on("themechange", function () {
					r(t)
				})


		})

	});


	function updateCharts(graph, type) {

		AWS.config.credentials.get(function (err) {
			if (err) {
				alert(err);
			}
		});

		AWS.config.region = 'sa-east-1';
		var docClient = new AWS.DynamoDB.DocumentClient();

		var fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24 * 7;
		var toValue = new Date().valueOf() - 1000 * 60 * 60 + 1000 * 60 * 60 * 3;

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
				var humidities = [];
				var temperatures = [];
				let lastMeasure;
				data.Items.forEach(function (measure) {

					humidities.push({ x: measure.TimeEpoch, y: measure.Payload.ground_humidity });
					temperatures.push({ x: measure.TimeEpoch, y: measure.Payload.air_temperature });
					lastMeasure = measure;
				});
				let humMod = simplify(humidities, 5, false);
				let temMod = simplify(temperatures, 1, false);
				if (type == 1)
					graph.setData(humMod);
				if (type == 2)
					graph.setData(temMod);
				$("#lastAirHum").html(lastMeasure.Payload.air_humidity + " %");
				$("#lastGndHum").html(lastMeasure.Payload.ground_humidity);
				$("#lastAirTemp").html(lastMeasure.Payload.air_temperature + " C°");
			}
		});
	}

	function updateActionList() {

		AWS.config.credentials.get(function (err) {
			if (err) {
				alert(err);
			}
		});

		AWS.config.region = 'sa-east-1';
		var docClient = new AWS.DynamoDB.DocumentClient();

		var fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24;
		var toValue = new Date().valueOf() - 1000 * 60 * 60 + 1000 * 60 * 60 * 3;

		let params2 = {
			TableName: "Actions",
			KeyConditionExpression: "#ID = :ID and TimeEpoch between :time1 and :time2",
			ScanIndexForward: false,
			ExpressionAttributeNames: {
				"#ID": "ID"
			},
			ExpressionAttributeValues: {
				":ID": "data",
				":time1": fromValue,
				":time2": toValue
			}
		};

		var totalWater = 0;
		var totalLight;

		docClient.query(params2, function (err, data) {
			if (err) {
				console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
			} else {
				let i = 1;
				while (i <= data.Items.length && i <= 5) {
					let action = data.Items[i - 1];

					let name, value;
					action.Payload.hasOwnProperty("light") ? name = "light" :
						action.Payload.hasOwnProperty("fan") ? name = "fan" :
							action.Payload.hasOwnProperty("bomb") ? name = "bomb" : "";

					value = action.Payload[name];
					$("#listActionName" + i).text("Modify " + name + " state");
					$("#listActionState" + i).text("Turn " + value);
					$("#listActionTime" + i).text(new Date(action.TimeEpoch).toLocaleString());
					if(name == "bomb"){
						totalWater += 5;
					}
					i++;
				}
				$("#totalWater").html(totalWater + " cc");
			}
		});
		
	}

	function sendAction(action) {

		AWS.config.credentials.get(function (err) {
			if (err) {
				alert(err);
			}
		});

		AWS.config.region = 'sa-east-1';

		var iotdata = new AWS.IotData({
			accessKeyId: AWS.config.credentials.accessKeyId,
			secretKey: AWS.config.credentials.secretAccessKey,
			sessionToken: AWS.config.credentials.sessionToken,
			region: AWS.config.region,
			endpoint: 'a3hk8xqcjduxe-ats.iot.sa-east-1.amazonaws.com'
		});

		var params = {
			topic: 'PepperActions', /* required */
			payload: action,
			qos: 0
		};
		//console.log(AWS.config.credentials.identityId);
		iotdata.publish(params, function (err, data) {
			if (err)
				console.log(err, err.stack); // an error occurred
			else
				console.log(data);           // successful response
		});

	}

}(jQuery));

