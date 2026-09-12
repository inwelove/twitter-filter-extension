// ============================================
// Twitter DOM 结构检查脚本
// 在浏览器控制台中运行此脚本来获取真实的DOM选择器
// ============================================

(function() {
  'use strict';
  
  console.log('=== Twitter DOM Structure Checker ===\n');
  
  // 获取所有推文
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  console.log(`Found ${tweets.length} tweets\n`);
  
  if (tweets.length === 0) {
    console.log('No tweets found. Make sure you are on a Twitter/X page with tweets visible.');
    return;
  }
  
  // 检查第一条推文的详细结构
  const firstTweet = tweets[0];
  console.log('--- First Tweet Structure ---\n');
  
  // 回复按钮
  const replyBtn = firstTweet.querySelector('[data-testid="reply"]');
  if (replyBtn) {
    console.log('Reply button found:');
    console.log('  - data-testid:', replyBtn.getAttribute('data-testid'));
    console.log('  - aria-label:', replyBtn.getAttribute('aria-label'));
    console.log('  - text content:', replyBtn.textContent.trim());
  }
  
  // 点赞按钮
  const likeBtn = firstTweet.querySelector('[data-testid="like"]') || firstTweet.querySelector('[data-testid="unlike"]');
  if (likeBtn) {
    console.log('\nLike button found:');
    console.log('  - data-testid:', likeBtn.getAttribute('data-testid'));
    console.log('  - aria-label:', likeBtn.getAttribute('aria-label'));
  }
  
  // 转发按钮
  const retweetBtn = firstTweet.querySelector('[data-testid="retweet"]') || firstTweet.querySelector('[data-testid="unretweet"]');
  if (retweetBtn) {
    console.log('\nRetweet button found:');
    console.log('  - data-testid:', retweetBtn.getAttribute('data-testid'));
    console.log('  - aria-label:', retweetBtn.getAttribute('aria-label'));
  }
  
  // 浏览量 - 查找 analytics 链接
  const analyticsLink = firstTweet.querySelector('a[href*="analytics"]');
  if (analyticsLink) {
    console.log('\nAnalytics link found:');
    console.log('  - href:', analyticsLink.getAttribute('href'));
    console.log('  - aria-label:', analyticsLink.getAttribute('aria-label'));
    console.log('  - text:', analyticsLink.textContent.trim());
    
    // 查看父元素结构
    const parent = analyticsLink.parentElement;
    if (parent) {
      console.log('  - parent tag:', parent.tagName);
      console.log('  - parent text:', parent.textContent.trim());
    }
  }
  
  // 查找 role="group" 区域（互动按钮组）
  const groupElement = firstTweet.querySelector('[role="group"]');
  if (groupElement) {
    console.log('\nEngagement group found:');
    console.log('  - innerHTML (first 500 chars):', groupElement.innerHTML.substring(0, 500));
    
    // 查找group中的所有链接和按钮
    const links = groupElement.querySelectorAll('a, button, [role="button"]');
    console.log('  - links/buttons in group:', links.length);
    links.forEach((link, i) => {
      console.log(`    [${i}] tag: ${link.tagName}, text: "${link.textContent.trim()}", aria-label: "${link.getAttribute('aria-label')}"`);
    });
  }
  
  // 查找所有包含数字的span
  console.log('\n--- Spans with numbers ---');
  const allSpans = firstTweet.querySelectorAll('span');
  const numberSpans = [];
  allSpans.forEach(span => {
    const text = span.textContent.trim();
    if (text.match(/^[\d,.]+[kKmM]?$/i) && text.length < 10) {
      numberSpans.push({
        text: text,
        parent: span.parentElement?.tagName,
        parentText: span.parentElement?.textContent.trim().substring(0, 50),
        ariaLabel: span.getAttribute('aria-label'),
        prevSibling: span.previousElementSibling?.tagName
      });
    }
  });
  console.log('Number spans found:', numberSpans.length);
  numberSpans.forEach((span, i) => {
    console.log(`  [${i}]`, span);
  });
  
  // 查找 aria-label 包含 views/浏览 的元素
  console.log('\n--- Elements with views-related aria-labels ---');
  const viewsElements = firstTweet.querySelectorAll('[aria-label*="view" i], [aria-label*="View"], [aria-label*="浏览"]');
  viewsElements.forEach((el, i) => {
    console.log(`  [${i}] tag: ${el.tagName}, aria-label: "${el.getAttribute('aria-label')}", text: "${el.textContent.trim()}"`);
  });
  
  // 输出完整的engagement区域HTML（用于分析）
  console.log('\n--- Engagement Area HTML (for analysis) ---');
  if (groupElement) {
    console.log(groupElement.outerHTML.substring(0, 2000));
  }
  
  console.log('\n=== End of Check ===');
  console.log('Please share this output so I can update the selectors accordingly.');
  
})();
