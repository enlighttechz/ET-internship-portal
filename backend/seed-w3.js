require('dotenv').config();
const mongoose = require('mongoose');
const Content = require('./models/Content');

const seedContents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lms');
    console.log('MongoDB Connected for Seeding');

    // Delete existing contents to avoid duplicates
    await Content.deleteMany({});
    console.log('Cleared existing contents.');

    const w3schoolsData = [
      {
        category: 'HTML Tutorial',
        title: 'HTML Introduction',
        type: 'text',
        body: 'HTML is the standard markup language for creating Web pages.\n\nWhat is HTML?\n- HTML stands for Hyper Text Markup Language\n- HTML is the standard markup language for creating Web pages\n- HTML describes the structure of a Web page\n- HTML consists of a series of elements\n- HTML elements tell the browser how to display the content',
        order: 1
      },
      {
        category: 'HTML Tutorial',
        title: 'HTML Elements',
        type: 'text',
        body: 'An HTML element is defined by a start tag, some content, and an end tag.\n\nThe HTML element is everything from the start tag to the end tag:\n\n<tagname>Content goes here...</tagname>\n\nExamples of some HTML elements:\n<h1>My First Heading</h1>\n<p>My first paragraph.</p>',
        order: 2
      },
      {
        category: 'HTML Tutorial',
        title: 'HTML Attributes',
        type: 'text',
        body: 'HTML attributes provide additional information about HTML elements.\n\n- All HTML elements can have attributes\n- Attributes provide additional information about elements\n- Attributes are always specified in the start tag\n- Attributes usually come in name/value pairs like: name="value"',
        order: 3
      },
      {
        category: 'CSS Tutorial',
        title: 'CSS Introduction',
        type: 'text',
        body: 'CSS is the language we use to style an HTML document.\n\nWhat is CSS?\n- CSS stands for Cascading Style Sheets\n- CSS describes how HTML elements are to be displayed on screen, paper, or in other media\n- CSS saves a lot of work. It can control the layout of multiple web pages all at once\n- External stylesheets are stored in CSS files',
        order: 4
      },
      {
        category: 'CSS Tutorial',
        title: 'CSS Syntax',
        type: 'text',
        body: 'A CSS rule consists of a selector and a declaration block.\n\nh1 {\n  color: blue;\n  font-size: 12px;\n}\n\nThe selector points to the HTML element you want to style. The declaration block contains one or more declarations separated by semicolons. Each declaration includes a CSS property name and a value, separated by a colon.',
        order: 5
      },
      {
        category: 'JavaScript Tutorial',
        title: 'JS Introduction',
        type: 'text',
        body: 'JavaScript is the world\'s most popular programming language.\n\nJavaScript is the programming language of the Web.\nJavaScript is easy to learn.\n\nThis tutorial will teach you JavaScript from basic to advanced.',
        order: 6
      },
      {
        category: 'JavaScript Tutorial',
        title: 'JS Variables',
        type: 'text',
        body: 'Variables are containers for storing data (storing data values).\n\nIn this example, x, y, and z, are variables, declared with the let keyword:\n\nlet x = 5;\nlet y = 6;\nlet z = x + y;\n\nFrom the example above, you can expect:\n- x stores the value 5\n- y stores the value 6\n- z stores the value 11',
        order: 7
      }
    ];

    await Content.insertMany(w3schoolsData);
    console.log('Successfully seeded W3Schools-like content!');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedContents();
