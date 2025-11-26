using Microsoft.AspNetCore.Http;
using System.Text;

namespace NaviSafe.Models
{
    /// <summary>
    /// Test helper to create mock IFormFile for testing image uploads
    /// </summary>
    public class MockFormFile : IFormFile
    {
        private readonly byte[] _content;
        private readonly string _fileName;
        private readonly string _contentType;

        public MockFormFile(byte[] content, string fileName, string contentType = "image/jpeg")
        {
            _content = content;
            _fileName = fileName;
            _contentType = contentType;
        }

        public string ContentType => _contentType;
        public string ContentDisposition => $"form-data; name=\"ImageFile\"; filename=\"{_fileName}\"";
        public IHeaderDictionary Headers => new HeaderDictionary();
        public long Length => _content.Length;
        public string Name => "ImageFile";
        public string FileName => _fileName;

        public void CopyTo(Stream target)
        {
            target.Write(_content, 0, _content.Length);
        }

        public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
        {
            await target.WriteAsync(_content, 0, _content.Length, cancellationToken);
        }

        public Stream OpenReadStream()
        {
            return new MemoryStream(_content);
        }
    }

    /// <summary>
    /// Simple test class to verify image upload integration
    /// </summary>
    public static class ImageUploadTest
    {
        /// <summary>
        /// Test that ObstacleDataForm can accept an IFormFile
        /// </summary>
        public static void TestImageBinding()
        {
            // Create a simple test image (just some bytes)
            var testImageBytes = Encoding.UTF8.GetBytes("fake image content for testing");
            var mockFile = new MockFormFile(testImageBytes, "test-image.jpg", "image/jpeg");

            // Create the form model
            var form = new ObstacleDataForm
            {
                shortDesc = "Test Tower",
                longDesc = "Test description",
                lat = 58.163f,
                lon = 8.002f,
                altitude = 50.0f,
                ImageFile = mockFile
            };

            // Verify the image file is properly bound
            if (form.ImageFile == null)
                throw new Exception("ImageFile should not be null");
            
            if (form.ImageFile.Length != testImageBytes.Length)
                throw new Exception($"Expected file length {testImageBytes.Length}, got {form.ImageFile.Length}");

            if (form.ImageFile.FileName != "test-image.jpg")
                throw new Exception($"Expected filename 'test-image.jpg', got '{form.ImageFile.FileName}'");

            Console.WriteLine("? Image upload binding test passed!");
            Console.WriteLine($"? File size: {form.ImageFile.Length} bytes");
            Console.WriteLine($"? File name: {form.ImageFile.FileName}");
            Console.WriteLine($"? Content type: {form.ImageFile.ContentType}");
        }
    }
}