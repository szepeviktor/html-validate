import HtmlValidate from '../htmlvalidate';

describe('rule heading-level', function(){

	const expect = require('chai').expect;

	let htmlvalidate: HtmlValidate;

	before(function(){
		htmlvalidate = new HtmlValidate({
			rules: {'heading-level': 'error'},
		});
	});

	it('should not report error for non-headings>', function(){
		const report = htmlvalidate.validateString('<p>lorem ipsum</p>');
		expect(report).to.be.valid;
	});

	it('should not report error when <h1> is followed by <h2>', function(){
		const report = htmlvalidate.validateString('<h1>heading 1</h1><h2>heading 2</h2>');
		expect(report).to.be.valid;
	});

	it('should not report error when <h3> is followed by <h2>', function(){
		const report = htmlvalidate.validateString('<h1>heading 1</h1><h2>heading 2</h2><h3>heading 3</h3><h2>heading 4</h2>');
		expect(report).to.be.valid;
	});

	it('should report error when <h1> is followed by <h3>', function(){
		const report = htmlvalidate.validateString('<h1>heading 1</h1><h3>heading 2</h3>');
		expect(report).to.be.invalid;
		expect(report).to.have.error('heading-level', 'Heading level can only increase by one, expected h2');
	});

	it('should report error when initial heading isn\'t <h1>', function(){
		const report = htmlvalidate.validateString('<h2>heading 2</h2>');
		expect(report).to.be.invalid;
		expect(report).to.have.error('heading-level', 'Initial heading level must be h1');
	});

});
