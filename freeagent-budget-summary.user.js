// ==UserScript==
// @name          FreeAgent Budget Summary
// @namespace     http://outlandishideas.co.uk
// @description   Add a bar chart to the project summary page showing work and expenses against budget
// @include       https://*.freeagentcentral.com/projects/*
// @include       https://*.freeagent.com/projects/*
// @version       2.0
// ==/UserScript==

function init($) {

	//reinsert block if user switched tabs
	$('#tertiary_nav .tabs li a').bind('click', function(){
		//try adding graph every 200ms
		var intervalTimer = setInterval(function(){init($);}, 200);
		//stop trying after 2s
		setTimeout(function(){clearInterval(intervalTimer);}, 2000);
	});

	//check we're on the right page and not already loaded
	if (!$('#profitability_chart_block').size() || $('#glance_block').size()) return;

	//extract billing and budget
	var data = {};
	$('#meta .panel .panel_data .detail').each(function(){
		data[$('h4', this).text()] = $('p', this).text();
	});

	//can't convert budget days to money
	if (data['Budget'].indexOf('Day') > 0) return;

	var billingRate = data['Billing Rate'].replace(/[^0-9\.]/g, '');
	var budget = data['Budget'].replace(/[^0-9\.]/g, '');

	//allow for budget to be specified in hours
	if (data['Budget'].indexOf('Hour') > 0) {
		budget *= billingRate;
	}

	//can't scale chart if no budget 
	if (budget == 0) return;

	//extract hours and expenses
	var hourBits = $('#breakdown_block li:first strong').text().split(':');
	var hours = parseInt(hourBits[0]) + (parseInt(hourBits[1])/60);
	var expenses = parseInt($('#summary_profit li:eq(1) strong').text().replace(/[^0-9\.]/g, ''));

	//get currency symbol(s)
	var currencyPrefix = $('#summary_profit .summary_data:first strong').text().match(/^[^0-9,\.]+/);
	var currencySuffix = $('#summary_profit .summary_data:first strong').text().match(/[^0-9,\.]+$/);
	if (currencyPrefix==null) currencyPrefix = '';
	if (currencySuffix==null) currencySuffix = '';

	//add container block
	var $innerDiv = $('<div class="chart_block" id="glance_block"><h3>At a Glance</h3><div ' +
		'style="border-radius: 4px;background-color:#fff;border:1px solid #ccc;padding:10px;line-height:1;font-size:13px">' +
		'<div style="position:relative;height:10px;margin-bottom:10px"></div></div></div>')
		.prependTo('#income_data')
		.find('div div');

	var chartHtml = '<div style="background-color:#{color};left:{left}%;right:0%;' +
		'height:100%;position:absolute;border-left:1px solid #fff;margin-left:-1px;"></div>';
	var labelHtml = '<div style="border-left:13px solid #{color};margin-right:20px;' +
		'padding-left:10px;display:inline-block;">{text}</div>';

	var spend = hours * billingRate + expenses;
	var scale = Math.max(budget, spend)/100;

	//add bar pieces
	$(chartHtml.replace('{color}', '649A23').replace('{left}', 0)).appendTo($innerDiv);
	$(chartHtml.replace('{color}', '87B354').replace('{left}', expenses/scale)).appendTo($innerDiv);
	$(chartHtml.replace('{color}', 'FFC726').replace('{left}', spend/scale)).appendTo($innerDiv);

	//add red chart piece and label if over budget
	if (spend > budget) {
		$innerDiv
			.append(chartHtml.replace('{color}', 'ff0000').replace('{left}', budget/scale))
			.after(labelHtml.replace('{color}', 'ff0000').replace('{text}', 'Over Budget '+currencyPrefix+Math.round(spend-budget)+currencySuffix));
	} else if (spend < budget) {
		//add remaining budget label
		$innerDiv
			.after(labelHtml.replace('{color}', 'FFC726').replace('{text}', 'Remaining Budget '+currencyPrefix+Math.round(budget-spend)+currencySuffix));
	}

	//add other labels
	$innerDiv.after(labelHtml.replace('{color}', '87B354').replace('{text}', 'Labour '+currencyPrefix+Math.round(hours*billingRate)+currencySuffix));
	if (expenses) {
		$innerDiv.after(labelHtml.replace('{color}', '649A23').replace('{text}', 'Expenses '+currencyPrefix+Math.round(expenses)+currencySuffix));
	}

}

//set up graph
init(jQuery);

jQuery.noConflict(true);