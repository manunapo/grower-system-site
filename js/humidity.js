/*global GrowerSystem _config*/


var GrowerSystem = window.GrowerSystem || {};
GrowerSystem.map = GrowerSystem.map || {};



(function humScopeWrapper($) {
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
	var samplingPeriod = 2;

	var graph1 = Morris.Line({
		element: "ground-hum-chart",
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
	});
	var graph2 = Morris.Line({
		element: "air-hum-chart",
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
	});

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

				updateCharts();
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


		$("#btn24").click(function () {
			samplingPeriod = 1;
			$("#btn24").addClass("active");
			$("#btn1w").removeClass("active");
			$("#btn1m").removeClass("active");
			updateCharts();
		});

		$("#btn1w").click(function () {
			samplingPeriod = 2;
			$("#btn1w").addClass("active");
			$("#btn24").removeClass("active");
			$("#btn1m").removeClass("active");
			updateCharts();
		});

		$("#btn1m").click(function () {
			samplingPeriod = 3;
			$("#btn1m").addClass("active");
			$("#btn1w").removeClass("active");
			$("#btn24").removeClass("active");
			updateCharts();
		});



	});


	function updateCharts() {

		AWS.config.credentials.get(function (err) {
			if (err) {
				alert(err);
			}
		});

		AWS.config.region = 'sa-east-1';
		var docClient = new AWS.DynamoDB.DocumentClient();
		var fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24 * 7;
		switch (samplingPeriod) {
			case 1:
				fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24;
				break;
			case 2:
				fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24 * 7;
				break;
			case 3:
				fromValue = new Date().valueOf() - 1000 * 60 * 60 * 24 * 30;
				break;
		}

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
				var gHum = [];
				var aHum = [];
				data.Items.forEach(function (measure) {

					gHum.push({ x: measure.TimeEpoch, y: measure.Payload.ground_humidity });
					aHum.push({ x: measure.TimeEpoch, y: measure.Payload.air_humidity });

				});
				let gndMod = simplify(gHum, 5, false);
				let airMod = simplify(aHum, 5, false);
				graph1.setData(gndMod);
				graph2.setData(airMod);

			}
		});
	}

}(jQuery));

