exports.config = {  
  name: 'creepypasta',  
  author: 'JohnDev19',  
  description: 'Fetches and returns data from Creepypasta based on a search query.',  
  category: 'search',  
  link: ['/creepypasta?q=cat']  
};  

exports.initialize = async function ({ req, res }) {  
  const axios = require('axios');
  const cheerio = require('cheerio');
  const cloudscraper = require('cloudscraper');

  const searchQuery = req.query.q;

  if (!searchQuery) {
      return res.status(400).json({ error: 'A search query "q" is required' });
  }

  const searchUrl = `https://www.creepypasta.com/?s=${encodeURIComponent(searchQuery)}`;

  try {
      const data = await cloudscraper.get(searchUrl);
      const $ = cheerio.load(data);

      const firstResult = $('.post').first();

      if (!firstResult.length) {
          return res.status(404).json({ error: 'No results found' });
      }

      const title = firstResult.find('.entry-title a').text();
      const url = firstResult.find('.entry-title a').attr('href');
      const imageUrl = firstResult.find('.post-thumb-img-content.post-thumb img').attr('src');
      const datePublished = firstResult.find('.post-date').text();

      const contentPage = await cloudscraper.get(url);
      const $$ = cheerio.load(contentPage);

      const readingTime = $$('span.rt-time').text();
      const overview = $$('h2.p1:contains("Overview")').next('p').text();
      const paragraphs = [];
      $$('.entry-content p').each((i, elem) => {
          paragraphs.push($$(elem).text());
      });

      const excerpt = paragraphs.join('\n\n');

      const article = {
          api_name: "Creepypasta",
          author: "JohnDev19",
          title,
          url,
          imageUrl,
          datePublished,
          readingTime,
          excerpt,
      };

      res.json(article);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while fetching the data' });
  }
};
