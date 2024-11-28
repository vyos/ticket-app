'use client'
import { ChangeEvent, useState } from 'react'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export default function Home() {
	const [ticketID, setTicketID] = useState('')
	const [files, setFiles] = useState<any[]>([])
	const [uploading, setUploading] = useState(false)
	const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)

	const creds = {
		accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
	}

	const s3Client = new S3Client({
		region: process.env.NEXT_PUBLIC_AWS_REGION,
		// @ts-expect-error
		credentials: creds,
	})

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (!event.target.files) return
		setFiles([...event.target.files])
	}

	const handleUpload = async () => {

		if (!ticketID) {
			setMessage('Please provide a Ticket ID')
			return
		}

		if (files.length === 0) {
			setMessage('Please select files to upload')
			return
		}

		setUploading(true)
		setMessage('')

    const progressState = files.reduce((acc, file) => {
      acc[file.name] = 0; // Initialize progress for each file at 0%
      return acc;
    }, {});

    setProgress(progressState)

    
		const arrOfRequests = files.map(async (file: any) => {
			const params = {
				Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
				Key: `${ticketID}/${file.name}`,
				Body: file,
			}

			return await s3Client.send(new PutObjectCommand(params), {
        // requestHandler: {
        //   onUploadProgress: (event) => {
        //     const percentage = Math.round(
        //       (event.loaded / event.total) * 100
        //     );
        //     setProgress((prev) => ({
        //       ...prev,
        //       [file.name]: percentage,
        //     }));
        //   },
        // },
      });
    })

		try {
			await Promise.all(arrOfRequests)
			setMessage('Files uploaded successfully!')
		} catch (error) {
			console.error('Error uploading files:', error)
			setMessage('Error uploading files.')
		} finally {
			setUploading(false)
		}
	}

	return (
		<div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
			<h1>Upload Attachments</h1>
			<div>
				<label>
					Ticket ID:
					<input
						type='text'
						value={ticketID}
						onChange={(e) => setTicketID(e.target.value)}
						placeholder='Enter Ticket ID'
						style={{ width: '100%', margin: '10px 0', padding: '8px' }}
					/>
				</label>
			</div>
			<div>
				<label>
					Attachments:
					<input
						type='file'
						multiple
						onChange={handleFileChange}
						style={{ margin: '10px 0', padding: '8px' }}
					/>
				</label>
			</div>
			<button
				onClick={handleUpload}
				disabled={uploading}
				style={{
					padding: '10px 20px',
					backgroundColor: uploading ? 'gray' : '#0070f3',
					color: 'white',
					border: 'none',
					cursor: uploading ? 'not-allowed' : 'pointer',
				}}
			>
				{uploading ? 'Uploading...' : 'Upload'}
        
			</button>
      {/* {uploading && files.length > 0 && files.map((file) => (
        <div key={file.name}>
          <p>{file.name}: {progress[file.name]}%</p>
          <progress value={progress[file.name]} max="100" />
        </div>
      ))} */}
			{message && <p>{message}</p>}
		</div>
	)
}
