
// import React, { useEffect, useState } from "react";
// import {
//   FiUploadCloud,
//   FiImage,
//   FiX,
//   FiCheckCircle,
//   FiAlertCircle
// } from "react-icons/fi";
// import { uploadRoom } from "../services/roomService";
// import "./RoomUpload.css";

// function RoomUpload() {
//   const [images, setImages] = useState([]);
//   const [roomType, setRoomType] = useState("Hall");
//   const [projectName, setProjectName] = useState("");
//   const [description, setDescription] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(null);

//   useEffect(() => {
//     return () => {
//       images.forEach((image) => URL.revokeObjectURL(image.url));
//     };
//   }, [images]);

//   const handleUpload = (e) => {
//     const files = Array.from(e.target.files || []);

//     const newImages = files.map((file) => ({
//       id: `${file.name}-${file.lastModified}-${Math.random()}`,
//       file,
//       name: file.name,
//       url: URL.createObjectURL(file)
//     }));

//     setImages((prev) => [...prev, ...newImages]);
//     setError("");
//     setSuccess(null);

//     // Allow selecting the same file again later.
//     e.target.value = "";
//   };

//   const removeImage = (id) => {
//     setImages((prev) => {
//       const imageToRemove = prev.find((image) => image.id === id);

//       if (imageToRemove) {
//         URL.revokeObjectURL(imageToRemove.url);
//       }

//       return prev.filter((image) => image.id !== id);
//     });

//     setSuccess(null);
//   };

//   const handleSubmit = async () => {
//     setError("");
//     setSuccess(null);

//     if (images.length === 0) {
//       setError("Please upload at least one room photograph.");
//       return;
//     }

//     if (!projectName.trim()) {
//       setError("Please enter a project name.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const result = await uploadRoom({
//         projectName: projectName.trim(),
//         roomType,
//         description: description.trim(),
//         files: images.map((image) => image.file)
//       });

//       setSuccess(result);
//     } catch (err) {
//       setError(err.message || "Unable to upload room images.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="upload-page">
//       <header className="top-header">
//         <div>
//           <h1>Upload Your Room</h1>
//           <p>Upload room photographs to start your 3D design journey.</p>
//         </div>
//       </header>

//       <div className="upload-content">
//         <div className="upload-main-card">
//           <div className="upload-heading">
//             <FiImage />
//             <h2>Room Photographs</h2>
//           </div>

//           <label className="upload-dropzone">
//             <FiUploadCloud />
//             <h3>Drag and drop your room images</h3>
//             <p>Or click below to browse your files</p>
//             <span>PNG, JPG, JPEG or WEBP</span>

//             <input
//               type="file"
//               accept="image/png,image/jpeg,image/webp"
//               multiple
//               onChange={handleUpload}
//               disabled={loading}
//             />
//           </label>

//           {images.length > 0 && (
//             <div className="uploaded-images">
//               {images.map((image) => (
//                 <div className="uploaded-image" key={image.id}>
//                   <img src={image.url} alt={image.name} />

//                   <button
//                     type="button"
//                     onClick={() => removeImage(image.id)}
//                     disabled={loading}
//                     aria-label={`Remove ${image.name}`}
//                   >
//                     <FiX />
//                   </button>

//                   <span>{image.name}</span>
//                 </div>
//               ))}
//             </div>
//           )}

//           <p className="upload-count">
//             {images.length} image{images.length === 1 ? "" : "s"} selected
//           </p>
//         </div>

//         <div className="upload-settings">
//           <h2>Room Details</h2>

//           <label>Room Type</label>
//           <select
//             value={roomType}
//             onChange={(e) => setRoomType(e.target.value)}
//             disabled={loading}
//           >
//             <option>Hall</option>
//             <option>Kitchen</option>
//             <option>Bedroom</option>
//             <option>Dining Room</option>
//           </select>

//           <label>Project Name</label>
//           <input
//             type="text"
//             placeholder="Enter project name"
//             value={projectName}
//             onChange={(e) => setProjectName(e.target.value)}
//             disabled={loading}
//           />

//           <label>Room Description</label>
//           <textarea
//             placeholder="Describe your room..."
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             disabled={loading}
//           />

//           {error && (
//             <div className="upload-message upload-error">
//               <FiAlertCircle />
//               <span>{error}</span>
//             </div>
//           )}

//           {success && (
//             <div className="upload-message upload-success">
//               <FiCheckCircle />
//               <div>
//                 <strong>Images uploaded successfully!</strong>
//                 <p>Room ID: {success.room_id}</p>
//                 <p>{success.images?.length || 0} images saved by backend.</p>
//               </div>
//             </div>
//           )}

//           <button
//             type="button"
//             className="primary-btn full-btn"
//             onClick={handleSubmit}
//             disabled={loading}
//           >
//             {loading ? "Uploading Images..." : "Continue to 3D Design"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default RoomUpload;






import React, { useEffect, useRef, useState } from "react";
import {
  FiUploadCloud,
  FiImage,
  FiX,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import "./RoomUpload.css";

function RoomUpload() {
  const [images, setImages] = useState([]);
  const [roomType, setRoomType] = useState("Hall");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const imagesRef = useRef([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, []);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);

    const validFiles = files.filter((file) =>
      ["image/png", "image/jpeg", "image/webp"].includes(file.type)
    );

    if (validFiles.length !== files.length) {
      setError("Only PNG, JPG, JPEG and WEBP images are allowed.");
    } else {
      setError("");
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    }));

    setImages((prev) => [...prev, ...newImages]);
    setSuccess(false);
  };

  const handleUpload = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const imageToRemove = prev.find((image) => image.id === id);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      return prev.filter((image) => image.id !== id);
    });

    setSuccess(false);
  };

  const handleSubmit = () => {
    setError("");
    setSuccess(false);

    if (images.length === 0) {
      setError("Please upload at least one room photograph.");
      return;
    }

    if (!projectName.trim()) {
      setError("Please enter a project name.");
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="upload-page">
      <header className="top-header">
        <div>
          <h1>Upload Your Room</h1>
          <p>
            Upload room photographs to start your 3D design journey.
          </p>
        </div>
      </header>

      <div className="upload-content">
        <div className="upload-main-card">
          <div className="upload-heading">
            <FiImage />
            <h2>Room Photographs</h2>
          </div>

          <label
            className={`upload-dropzone ${dragActive ? "drag-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <FiUploadCloud />

            <h3>Drag and drop your room images</h3>

            <p>Or click below to browse your files</p>

            <span>PNG, JPG, JPEG or WEBP</span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleUpload}
            />
          </label>

          {images.length > 0 && (
            <div className="uploaded-images">
              {images.map((image) => (
                <div className="uploaded-image" key={image.id}>
                  <img src={image.url} alt={image.name} />

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label={`Remove ${image.name}`}
                  >
                    <FiX />
                  </button>

                  <span>{image.name}</span>
                </div>
              ))}
            </div>
          )}

          <p className="upload-count">
            {images.length} image{images.length === 1 ? "" : "s"} selected
          </p>
        </div>

        <div className="upload-settings">
          <h2>Room Details</h2>

          <label htmlFor="room-type">Room Type</label>

          <select
            id="room-type"
            value={roomType}
            onChange={(e) => {
              setRoomType(e.target.value);
              setSuccess(false);
            }}
          >
            <option>Hall</option>
            <option>Kitchen</option>
            <option>Bedroom</option>
            <option>Dining Room</option>
          </select>

          <label htmlFor="project-name">Project Name</label>

          <input
            id="project-name"
            type="text"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setSuccess(false);
            }}
          />

          <label htmlFor="room-description">Room Description</label>

          <textarea
            id="room-description"
            placeholder="Describe your room..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSuccess(false);
            }}
          />

          {error && (
            <div className="upload-message upload-error">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="upload-message upload-success">
              <FiCheckCircle />
              <div>
                <strong>Images uploaded successfully!</strong>
                <p>Project: {projectName}</p>
                <p>Room Type: {roomType}</p>
                <p>{images.length} images selected successfully.</p>
                <small>
                  Demo mode: Images are currently stored only in this browser
                  session.
                </small>
              </div>
            </div>
          )}

          <button
            type="button"
            className="primary-btn full-btn"
            onClick={handleSubmit}
          >
            Continue to 3D Design
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomUpload;
