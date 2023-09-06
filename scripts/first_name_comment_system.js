document.addEventListener('DOMContentLoaded', function() {
  const textInput = document.getElementById('text_input');
  const addCommentButton = document.getElementById('dot');
  const commentList = document.getElementById('comment_list');
  const commentContainer = document.getElementById('comment_container');

  addCommentButton.addEventListener('click', addComment);

  function addComment() {
    const comment = prompt('Add a comment:');
    if (comment) {
      const commentElement = createCommentElement(comment);
      commentList.appendChild(commentElement);

      const separator = document.createElement('div');
      separator.className = 'comment-separator';
      commentList.appendChild(separator);
    }
  }

  function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';

    const commentDot = document.createElement('div');
    commentDot.className = 'comment-dot';
    commentElement.appendChild(commentDot);

    const authorLabel = document.createElement('div');
    authorLabel.className = 'author-label';
    authorLabel.textContent = 'Author';
    commentElement.appendChild(authorLabel);
    
    const commentText = document.createElement('div');
    commentText.className = 'comment-text';
    commentText.textContent = comment;
    commentElement.appendChild(commentText);

    const commentButtons = document.createElement('div');
    commentButtons.className = 'comment-buttons';

    const approveButton = createButton('Approve', () => {
      commentElement.style.backgroundColor = 'green';
    });

    const denyButton = createButton('Deny', () => {
      commentElement.style.backgroundColor = 'red';
    });

    const deleteButton = createButton('Delete', () => {
      commentList.removeChild(commentElement);
      // Find and remove the corresponding separator
      const separators = commentList.getElementsByClassName('comment-separator');
      for (let i = 0; i < separators.length; i++) {
        if (separators[i].nextSibling === commentElement) {
          commentList.removeChild(separators[i]);
          break;
        }
      }
    });    

    commentButtons.appendChild(approveButton);
    commentButtons.appendChild(denyButton);
    commentButtons.appendChild(deleteButton);
    commentElement.appendChild(commentButtons);

    return commentElement;
  }

  function createButton(text, clickHandler) {
    const button = document.createElement('button');
    button.className = 'approve-button';
    button.textContent = text;
    button.addEventListener('click', clickHandler);
    return button;
  }

  function showComments() {
    commentList.style.display = 'block';
  }

  function hideComments() {
    commentList.style.display = 'none';
  }

  // Event listeners for showing/hiding comments
  commentContainer.addEventListener('mouseenter', showComments);
  commentContainer.addEventListener('mouseleave', hideComments);
  commentList.addEventListener('mouseenter', showComments);
  commentList.addEventListener('mouseleave', hideComments);
});