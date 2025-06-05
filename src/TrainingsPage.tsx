const TrainingsPage = () => (
  <div style={{ maxWidth: 800, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 8 }}>
    <h2>Trainings</h2>
    <p>This is the Trainings page. Add your training management features here.</p>
    <div style={{ marginTop: '2rem', textAlign: 'center' }}>

      <h3 style={{ marginTop: '2rem' }}>Flickr Image</h3>

      <a data-flickr-embed="true" 
      href="https://www.flickr.com/photos/134505298@N07/54523349098/in/dateposted-public/" 
      title="DSC_0303-2">
      <img src="https://live.staticflickr.com/65535/54523349098_9559f2f658_h.jpg" width="200" height="auto" alt="DSC_0303-2"
      style={{ borderRadius: '12px' }}
      /></a>

    </div>
  </div>
);

export default TrainingsPage;
