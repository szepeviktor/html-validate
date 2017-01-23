'use strict';

var expect = require('chai').expect;
var HtmlLint = require('../htmllint');

describe('rule close-order', function(){
	var htmllint;

	before(function(){
		htmllint = new HtmlLint();
	});

	it('should not report when elements are correct in wrong order', function(){
		var report = {};
		expect(htmllint.string('<div></div>', report), "should parse valid html").to.be.true;
		expect(report.valid, "linting should report success").to.be.true;
		expect(report.error, "report should contain no errors").to.have.lengthOf(0);
	});

	it('should not report for self-closing element', function(){
		var report = {};
		expect(htmllint.string('<div><input/></div>', report), "should parse valid html").to.be.true;
		expect(report.valid, "linting should report success").to.be.true;
		expect(report.error, "report should contain no errors").to.have.lengthOf(0);
	});

	it('should report error when elements are closed in wrong order', function(){
		var report = {};
		expect(htmllint.string('<div></p>', report), "should parse malformed html").to.be.true;
		expect(report.valid, "linting should report failure").to.be.false;
		expect(report.error, "report should contain 1 error").to.have.lengthOf(1);
		expect(report.error[0].rule, "reported error should be close-order").to.equal('close-order');
	});

	it('should report error when element is missing close tag', function(){
		var report = {};
		expect(htmllint.string('<div>', report), "should parse malformed html").to.be.true;
		expect(report.valid, "linting should report failure").to.be.false;
		expect(report.error, "report should contain 1 error").to.have.lengthOf(1);
		expect(report.error[0].rule, "reported error should be close-order").to.equal('close-order');
	});

});
