document.addEventListener('DOMContentLoaded', () => {
    // Get all required elements
    const elements = {
      form: document.querySelector('form'),
      formContainer: document.getElementById('formContainer'),
      errorDiv: document.getElementById('submitError'),
      errorMessage: document.getElementById('errorMessage'),
      successDiv: document.getElementById('submitSuccess'),
      successMessage: document.getElementById('successMessage'),
      textarea: document.getElementById('reasonText'),
      characterCount: document.getElementById('characterCount'),
      characterWarning: document.getElementById('characterWarning'),
      submitButton: document.querySelector('button[type="submit"]'),
      loadingOverlay: document.getElementById('loadingOverlay')
    };
  
    // Verify all required elements exist
    const missingElements = Object.entries(elements)
      .filter(([_, element]) => !element)
      .map(([name]) => name);
  
    if (missingElements.length > 0) {
      console.error('Missing required elements:', missingElements.join(', '));
      return;
    }
  
    const MIN_CHARS = 150;
  
    // Character counter functionality
    elements.textarea.addEventListener('input', () => {
      const currentLength = elements.textarea.value.length;
      elements.characterCount.textContent = `${currentLength}/${MIN_CHARS} characters minimum`;
      
      if (currentLength < MIN_CHARS) {
        elements.characterWarning.style.display = 'block';
        elements.characterCount.classList.add('text-error');
      } else {
        elements.characterWarning.style.display = 'none';
        elements.characterCount.classList.remove('text-error');
      }
    });
  
    elements.form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevent default form submission
      elements.errorDiv.classList.add('hidden');
      elements.successDiv.classList.add('hidden');
  
      try {
        const formData = new FormData(elements.form);
        const turnstileResponse = formData.get('cf-turnstile-response');
        if (!turnstileResponse) {
          elements.errorMessage.textContent = 'Please complete the security check';
          elements.errorDiv.classList.remove('hidden');
          return;
        }
  
        // Show loading state
        elements.loadingOverlay.classList.remove('hidden');
        elements.submitButton.disabled = true;
        elements.submitButton.textContent = 'Submitting...';
  
        const response = await fetch('/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(formData)
        });
  
        const data = await response.json();
  
        if (!response.ok) throw new Error(data.error || 'An error occurred while submitting your story.');
  
        // Show success message and hide form
        elements.successMessage.textContent = data.moderation_status === 'approved' 
          ? 'Your story has been successfully submitted and is now live!'
          : 'Your story has been submitted and is pending review. It will appear once approved.';
        elements.successDiv.classList.remove('hidden');
        elements.formContainer.classList.add('hidden');
        elements.form.reset();
  
        // Reload the page after a short delay to show the new post
        setTimeout(() => {
          window.location.reload();
        }, 2000);
  
      } catch (error) {
        elements.errorMessage.textContent = error.message || 'An error occurred while submitting your story.';
        elements.errorDiv.classList.remove('hidden');
      } finally {
        elements.loadingOverlay.classList.add('hidden');
        elements.submitButton.disabled = false;
        elements.submitButton.textContent = 'Share Your Story';
      }
    });
});