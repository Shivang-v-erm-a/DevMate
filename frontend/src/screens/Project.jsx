import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import 'highlight.js/styles/nord.min.css'
import { getWebContainer } from '../config/webcontainer.js'
import { motion } from 'framer-motion' // Using same animation library as Home

function SyntaxHighlightedCode(props) {
  const ref = useRef(null)

  React.useEffect(() => {
    if (ref.current && props.className?.includes('lang-')) {
      hljs.highlightElement(ref.current)
      ref.current.removeAttribute('data-highlighted')
    }
  }, [props.className, props.children])

  return <code {...props} ref={ref} />
}

const Project = () => {
  const location = useLocation()
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(new Set())
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState('')
  const { user } = useContext(UserContext)
  const messageBox = useRef(null)
  const fileInputRef = useRef(null)

  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [fileTree, setFileTree] = useState({})

  const [currentFile, setCurrentFile] = useState(null)
  const [openFiles, setOpenFiles] = useState([])

  const [webContainer, setWebContainer] = useState(null)
  const [iframeUrl, setIframeUrl] = useState(null)

  const [runProcess, setRunProcess] = useState(null)
  const [runningStatus, setRunningStatus] = useState('idle')
  const [isUploading, setIsUploading] = useState(false)

  // Debug state variables when they change
  useEffect(() => {
    console.log("Debug - isSidePanelOpen:", isSidePanelOpen);
    console.log("Debug - project:", project);
    console.log("Debug - project.users:", project?.users);
    console.log("Debug - users:", users);
  }, [isSidePanelOpen, project, users]);

  // Restructure file tree function remains the same
  const restructureFileTree = (fileTree) => {
    const newTree = {};

    Object.keys(fileTree).forEach(path => {
      if (!path.includes('/')) {
        newTree[path] = fileTree[path];
        return;
      }

      const segments = path.split('/');
      let currentLevel = newTree;

      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];

        if (!currentLevel[segment]) {
          currentLevel[segment] = { directory: {} };
        } else if (!currentLevel[segment].directory) {
          currentLevel[segment] = { directory: {} };
        }

        currentLevel = currentLevel[segment].directory;
      }

      const fileName = segments[segments.length - 1];
      currentLevel[fileName] = { file: fileTree[path].file };
    });

    return newTree;
  };

  const handleUserClick = (id) => {
    setSelectedUserId(prevSelectedUserId => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  }

  function addCollaborators() {
    axios.put("/projects/add-user", {
      projectId: location.state.project._id,
      users: Array.from(selectedUserId)
    }).then(res => {
      console.log(res.data)
      // Update the project state with new users
      setProject(prevProject => ({
        ...prevProject,
        users: [...(prevProject.users || []), ...Array.from(selectedUserId)]
      }));
      setIsModalOpen(false)
    }).catch(err => {
      console.log(err)
    })
  }

  const send = () => {
    if (!message.trim()) return;

    sendMessage('project-message', {
      message,
      sender: user
    })
    setMessages(prevMessages => [...prevMessages, { sender: user, message }])
    setMessage("")

    setTimeout(scrollToBottom, 100);
  }

  function WriteAiMessage(message) {
    try {
      const messageObject = JSON.parse(message)
      return (
        <div className='overflow-auto bg-gray-900 text-white rounded-lg p-4 border border-gray-800'>
          <Markdown
            children={messageObject.text}
            options={{
              overrides: {
                code: SyntaxHighlightedCode,
              },
            }}
          />
        </div>
      )
    } catch (error) {
      console.error("Error parsing AI message:", error)
      return <div className='overflow-auto bg-gray-900 text-white rounded-lg p-4 border border-gray-800'>{message}</div>
    }
  }

  useEffect(() => {
    hljs.configure({
      ignoreUnescapedHTML: true
    });

    const codeElements = document.querySelectorAll('pre code');
    codeElements.forEach((el) => {
      hljs.highlightElement(el);
    });
  }, []);

  // Consolidated data fetching in a single useEffect
  useEffect(() => {
    initializeSocket(project._id)

    if (!webContainer) {
      getWebContainer().then(container => {
        setWebContainer(container)
        console.log("container started")
      })
    }

    // First, fetch the project data with populated users
    axios.get(`/projects/get-project/${location.state.project._id}`)
      .then(res => {
        console.log("Project data with populated users:", res.data.project)

        // Store the project with populated users
        setProject(res.data.project)
        setFileTree(res.data.project.fileTree || {})

        // Check if users are properly populated as objects
        const areUserObjectsPopulated = res.data.project.users &&
          res.data.project.users.length > 0 &&
          typeof res.data.project.users[0] === 'object';

        if (!areUserObjectsPopulated) {
          console.log("Users not populated, fetching separately");
          // If not populated properly, fetch all users as fallback
          return axios.get('/users/all')
            .then(usersRes => {
              console.log("All users fetched:", usersRes.data.users)
              setUsers(usersRes.data.users || [])
            });
        }
      })
      .catch(err => {
        console.log("Error in data fetching:", err)

        // Fallback to fetching all users
        axios.get('/users/all')
          .then(res => {
            console.log("Fallback users fetched:", res.data.users)
            setUsers(res.data.users || [])
          })
          .catch(usersErr => console.log("Error fetching users:", usersErr))
      })

    receiveMessage('project-message', data => {
      console.log("Received message:", data);

      let messageObj = {
        sender: {
          _id: data.sender?._id || 'ai',
          email: data.sender?.email || 'AI Assistant'
        },
        message: data.message || ''
      };

      if (messageObj.sender._id === 'ai') {
        try {
          const parsedMessage = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;

          if (parsedMessage.fileTree) {
            const restructuredFileTree = restructureFileTree(parsedMessage.fileTree);
            webContainer?.mount(restructuredFileTree);
            setFileTree(parsedMessage.fileTree);
          }
        } catch (error) {
          console.error("Error handling AI message:", error)
        }
      }

      setMessages(prevMessages => [...prevMessages, messageObj]);
      setTimeout(scrollToBottom, 100);
    });

    setTimeout(scrollToBottom, 300);
  }, [])

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentFile) {
      const codeElement = document.querySelector('.code-editor-area pre code');
      if (codeElement) {
        hljs.highlightElement(codeElement);
      }
    }
  }, [currentFile, fileTree]);

  function saveFileTree(ft) {
    axios.put('/projects/update-file-tree', {
      projectId: project._id,
      fileTree: ft
    }).then(res => {
      console.log(res.data)
    }).catch(err => {
      console.log(err)
    })
  }

  function scrollToBottom() {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }

  const getFileType = (filename) => {
    if (!filename) return 'unknown';

    const extension = filename.split('.').pop().toLowerCase();

    if (extension === 'html' || extension === 'htm') return 'html';
    if (extension === 'css') return 'css';
    if (extension === 'js') return 'javascript';
    if (extension === 'jsx') return 'react';
    if (extension === 'json') return 'json';

    return extension;
  }

  // Handle file upload function
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Process each file
    Array.from(files).forEach(file => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const fileName = file.name;
        const fileContent = event.target.result;

        // If it's a binary file (like image), we need to handle differently
        // For now, let's handle text files only
        const isTextFile = file.type.startsWith('text/') ||
          ['application/json', 'application/javascript', 'application/xml'].includes(file.type);

        if (isTextFile) {
          // Text file handling
          const newFileTree = {
            ...fileTree,
            [fileName]: {
              file: {
                contents: fileContent
              }
            }
          };

          setFileTree(newFileTree);
          saveFileTree(newFileTree);

          // Open the file if it's the only one uploaded
          if (files.length === 1) {
            setCurrentFile(fileName);
            if (!openFiles.includes(fileName)) {
              setOpenFiles([...openFiles, fileName]);
            }
          }
        } else {
          // For binary files, we could either:
          // 1. Convert to base64 (not ideal for large files)
          // 2. Use a separate API endpoint to handle binary file uploads
          // 3. Show an error message that binary files aren't supported yet
          console.log("Binary files not fully supported yet:", fileName);

          // For now, let's store it anyway and let the backend handle it
          const newFileTree = {
            ...fileTree,
            [fileName]: {
              file: {
                contents: fileContent
              }
            }
          };

          setFileTree(newFileTree);
          saveFileTree(newFileTree);
        }

        // If this is the last file, reset uploading state
        if (Array.from(files).indexOf(file) === files.length - 1) {
          setIsUploading(false);
        }
      };

      if (file.type.startsWith('text/') ||
        ['application/json', 'application/javascript', 'application/xml'].includes(file.type)) {
        reader.readAsText(file);
      } else {
        // For binary files, read as data URL for now
        reader.readAsDataURL(file);
      }
    });

    // Reset the file input
    e.target.value = null;
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Additional functions (createSimpleServer, runCurrentProject, etc.) remain the same
  const createSimpleServer = async () => {
    try {
      const serverFileContent = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
  
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  const extname = path.extname(filePath);
  let contentType = contentTypes[extname] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        fs.readFile('./index.html', (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading the file');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
      `;

      const createDefaultHtml = async () => {
        const htmlFiles = Object.keys(fileTree).filter(file =>
          file.toLowerCase().endsWith('.html') || file.toLowerCase().endsWith('.htm')
        );

        if (htmlFiles.length === 0) {
          const defaultHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple HTML Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a default HTML page created by the system.</p>
</body>
</html>
          `;

          const newFileTree = {
            ...fileTree,
            'index.html': {
              file: {
                contents: defaultHtml
              }
            }
          };

          setFileTree(newFileTree);
          await webContainer.mount(newFileTree);
          saveFileTree(newFileTree);
        }
      };

      await webContainer.fs.writeFile('server.js', serverFileContent);
      await createDefaultHtml();

      return true;
    } catch (error) {
      console.error('Error creating simple server:', error);
      return false;
    }
  };

  const runCurrentProject = async () => {
    try {
      setRunningStatus('starting');

      if (runProcess) {
        runProcess.kill();
        setRunProcess(null);
      }

      const restructuredFileTree = restructureFileTree(fileTree);
      await webContainer.mount(restructuredFileTree);

      const hasPackageJson = Object.keys(fileTree).includes('package.json');
      const hasHtmlFiles = Object.keys(fileTree).some(file =>
        file.toLowerCase().endsWith('.html') || file.toLowerCase().endsWith('.htm')
      );

      if (hasPackageJson) {
        const installProcess = await webContainer.spawn("npm", ["install"]);

        installProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk);
          }
        }));

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          console.error('npm install failed with exit code', installExitCode);
          setRunningStatus('error');
          return;
        }

        const startProcess = await webContainer.spawn("npm", ["start"]);

        startProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk);
          }
        }));

        setRunProcess(startProcess);
      } else if (hasHtmlFiles) {
        const serverCreated = await createSimpleServer();

        if (!serverCreated) {
          setRunningStatus('error');
          return;
        }

        const serverProcess = await webContainer.spawn("node", ["server.js"]);

        serverProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk);
          }
        }));

        setRunProcess(serverProcess);
        setIframeUrl('http://localhost:3000');
      } else {
        console.error('No supported files found to run');
        setRunningStatus('error');
        return;
      }

      webContainer.on('server-ready', (port, url) => {
        console.log(`Server ready on port ${port} at ${url}`);
        setIframeUrl(url);
        setRunningStatus('running');
      });

    } catch (error) {
      console.error('Error running project:', error);
      setRunningStatus('error');
    }
  };

  const isCurrentUserMessage = (messageObj) => {
    return messageObj.sender._id === user._id?.toString();
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();

    if (extension === 'html' || extension === 'htm') return "ri-html5-fill";
    if (extension === 'css') return "ri-css3-fill";
    if (extension === 'js') return "ri-javascript-fill";
    if (extension === 'jsx') return "ri-reactjs-fill";
    if (extension === 'json') return "ri-file-code-fill";
    if (extension === 'md') return "ri-markdown-fill";

    return "ri-file-text-fill";
  };

  // download feature for files
  const downloadFile = (fileName) => {
    // Get the file content from your fileTree
    const fileContent = fileTree[fileName]?.file?.contents;

    if (fileContent !== undefined) {
      // Create a blob with the file content
      const blob = new Blob([fileContent], { type: 'text/plain' });

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;

      // Append to the document, click it, and remove it
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } else {
      console.error(`File ${fileName} not found or has no content`);
      // Optionally show a user-friendly error notification
      alert(`Cannot download ${fileName}: File not found or empty`);
    }
  };

  return (
    <main className='min-h-screen w-full bg-black flex'>
      {/* Background effects similar to Home page */}
      <div className="absolute w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-10 animate-pulse left-30 top-30"></div>
      <div className="absolute w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-10 animate-pulse right-0 bottom-0"></div>

      {/* Left Panel - Chat */}
      <section className="left relative flex flex-col h-screen w-1/3 min-w-64 border-r border-gray-800">
        <motion.header
          style={{ padding: 10 }}
          className='flex justify-between items-center p-4 w-full bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 absolute z-10 top-0'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            style={{ cursor: 'pointer' }}
            className='flex gap-2 items-center text-gray-300 hover:text-white transition-colors duration-300'
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="ri-add-fill mr-1"></i>
            <p className="font-['Poppins',sans-serif]">Add collaborator</p>
          </motion.button>

          <motion.button
            style={{ cursor: 'pointer' }}
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className='p-2 text-gray-300 hover:text-white transition-colors duration-300'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="ri-group-fill"></i>
          </motion.button>
        </motion.header>

        <div className="conversation-area pt-20 pb-16 flex-grow flex flex-col min-h-96 relative">
          <div
            style={{ marginTop: 50, marginBottom: 50, marginLeft: 10, marginRight: 10 }}
            ref={messageBox}
            className="message-box pt-4 pb-20 p-4 flex-grow flex flex-col gap-4 overflow-auto max-h-full scrollbar-hide"
          >
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                className={`message-container flex w-full ${isCurrentUserMessage(msg) ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div
                  style={{ padding: 4 }}
                  className={`message flex flex-col p-4 ${msg.sender._id === 'ai'
                    ? 'bg-gradient-to-br from-gray-900 to-black border border-gray-800 max-w-80'
                    : isCurrentUserMessage(msg)
                      ? 'bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-blue-800/50 max-w-72'
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 max-w-72'
                    } rounded-xl shadow-md ${isCurrentUserMessage(msg) ? 'rounded-tr-none' : 'rounded-tl-none'
                    }`}
                >
                  <small className='text-xs text-gray-400 mb-2 font-["Inter",sans-serif]'>{msg.sender.email || 'Unknown'}</small>
                  <div style={{ margin: 4, fontSize: 18 }} className='text-sm text-gray-200'>
                    {msg.sender._id === 'ai'
                      ? WriteAiMessage(msg.message)
                      : <p className="break-words font-['Inter',sans-serif]">{msg.message}</p>
                    }
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ padding: 8 }} className="inputField w-full flex absolute bottom-0 bg-gradient-to-r from-gray-900 to-black border-t border-gray-800">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  send();
                }
              }}
              className='p-4 px-5 border-none outline-none flex-grow bg-transparent text-gray-300 font-["Inter",sans-serif]'
              type="text"
              placeholder='Enter message...'
            />
            <motion.button
              style={{ cursor: 'pointer', fontSize: 20 }}
              onClick={send}
              className='px-5 text-blue-400 hover:text-blue-300 transition-colors duration-300'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className="ri-send-plane-fill"></i>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Center Panel - Code Editor */}
      <section className="center relative flex flex-col h-screen flex-grow bg-gray-950">
        <motion.header
          style={{ padding: 7, overflow: 'hidden' }}
          className='flex justify-between items-center p-4 w-full bg-gradient-to-r from-gray-900 to-black border-b border-gray-800'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="file-tabs flex gap-2 overflow-x-auto hide-scrollbar">
            {openFiles.map((file, index) => (
              <motion.div
                key={index}
                className={`file-tab flex items-center gap-2 p-2 rounded ${currentFile === file ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
                  } cursor-pointer transition-colors duration-300`}
                onClick={() => setCurrentFile(file)}
              >
                <i className={getFileIcon(file)}></i>
                <span className="font-['Poppins',sans-serif] text-sm">{file}</span>
                <button
                  className="ml-2 text-gray-500 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFiles(openFiles.filter(f => f !== file));
                    if (currentFile === file) {
                      setCurrentFile(openFiles.length > 1 ? openFiles.filter(f => f !== file)[0] : null);
                    }
                  }}
                >
                  <i className="ri-close-line"></i>
                </button>
              </motion.div>
            ))}
          </div>

          <motion.button
            style={{ cursor: 'pointer', padding: 3 }}
            onClick={runCurrentProject}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${runningStatus === 'starting' ? 'bg-yellow-600' :
              runningStatus === 'running' ? 'bg-green-600' :
                runningStatus === 'error' ? 'bg-red-600' :
                  'bg-blue-600'
              } text-white transition-colors duration-300`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={runningStatus === 'starting'}
          >
            {runningStatus === 'starting' ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                <span className="font-['Poppins',sans-serif]">Starting...</span>
              </>
            ) : runningStatus === 'running' ? (
              <>
                <i className="ri-refresh-line"></i>
                <span className="font-['Poppins',sans-serif]">Restart</span>
              </>
            ) : runningStatus === 'error' ? (
              <>
                <i className="ri-error-warning-line"></i>
                <span className="font-['Poppins',sans-serif]">Try Again</span>
              </>
            ) : (
              <>
                <i className="ri-play-fill"></i>
                <span className="font-['Poppins',sans-serif]">Run</span>
              </>
            )}
          </motion.button>
        </motion.header>

        <div className="editor-container flex flex-grow">

          {/* File tree sidebar */}
          <div style={{ overflow: 'hidden' }} className="file-tree w-60 border-r border-gray-800 overflow-y-auto bg-gray-900 p-3">


            <h3 style={{ margin: 4, fontSize: 15 }} className="text-gray-400 font-semibold mb-3 px-2 font-['Poppins',sans-serif]">Files</h3>

            <div className="files">
              {Object.keys(fileTree).map((file, index) => (
                <motion.div
                  key={index}
                  className={`file flex items-center gap-2 p-2 rounded cursor-pointer ${currentFile === file ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
                    } transition-colors duration-300 group`} // Added group for hover effect
                  onClick={() => {
                    setCurrentFile(file);
                    if (!openFiles.includes(file)) {
                      setOpenFiles([...openFiles, file]);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <i className={getFileIcon(file)}></i>
                  <span className="text-sm truncate flex-grow font-['Inter',sans-serif]">{file}</span>
                  <button
                    className="download-btn text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent file selection when clicking download
                      downloadFile(file);
                    }}
                    title="Download file"
                  >
                    <i className="ri-download-line"></i>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* File Action Buttons */}
            <div className="file-actions flex gap-2 mt-4">
              <motion.button
                style={{ cursor: 'pointer' }}
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-gray-800 text-gray-300 hover:text-white transition-colors duration-300"
                onClick={() => {
                  const fileName = prompt('Enter file name:');
                  if (fileName && !fileTree[fileName]) {
                    const newFileTree = {
                      ...fileTree,
                      [fileName]: {
                        file: {
                          contents: ''
                        }
                      }
                    };
                    setFileTree(newFileTree);
                    setCurrentFile(fileName);
                    setOpenFiles([...openFiles, fileName]);
                    saveFileTree(newFileTree);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="ri-add-line"></i>
                <span className="text-sm font-['Poppins',sans-serif]">New File</span>
              </motion.button>

              <motion.button
                style={{ cursor: 'pointer' }}
                className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md bg-gray-800 text-gray-300 hover:text-white transition-colors duration-300"
                onClick={triggerFileUpload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="ri-upload-line"></i>
                <span className="text-sm font-['Poppins',sans-serif]">Upload</span>
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                multiple
              />
            </div>

            {/* Upload Status Indicator */}
            {isUploading && (
              <div className="upload-status mt-2 p-2 bg-gray-800 rounded-md">
                <div className="flex items-center gap-2">
                  <i className="ri-loader-4-line animate-spin text-blue-400"></i>
                  <span className="text-sm text-gray-300 font-['Inter',sans-serif]">Uploading...</span>
                </div>
              </div>
            )}

          </div>

          {/* Main editor area */}
          <div className="editor-area flex-grow flex flex-col bg-gray-950">
            {currentFile ? (
              <div className="code-editor-area h-full relative overflow-auto">
                <textarea
                  style={{color:'white'}}
                  value={fileTree[currentFile]?.file?.contents || ''}
                  onChange={(e) => {
                    const newFileTree = {
                      ...fileTree,
                      [currentFile]: {
                        file: {
                          contents: e.target.value
                        }
                      }
                    };
                    setFileTree(newFileTree);
                    saveFileTree(newFileTree);
                  }}
                  className="h-full w-full p-4 bg-gray-950 text-gray-200 border-none resize-none outline-none font-mono"
                  spellCheck="false"
                />
                <pre className="absolute inset-0 pointer-events-none p-4 font-mono">
                  <code className={`language-${getFileType(currentFile)}`}>
                    {fileTree[currentFile]?.file?.contents || ''}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="ri-file-code-line text-6xl mb-4"></i>
                <p className="text-xl font-['Poppins',sans-serif]">Select a file to edit</p>
                <p className="text-sm mt-2 font-['Inter',sans-serif]">or create a new one to get started</p>
              </div>
            )}
          </div>

          {/* Preview panel when project is running */}
          {iframeUrl && (
            <div className="preview-panel w-1/2 border-l border-gray-800 bg-white">
              <iframe
                src={iframeUrl}
                className="w-full h-full border-none"
                title="Project Preview"
                sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              />
            </div>
          )}
        </div>
      </section>


      {/* Collaborators Side Panel */}
      {isSidePanelOpen && (
        <motion.section
          className="left-panel absolute left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 overflow-auto z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 pt-20">
            <h3 style={{ padding: 10, fontSize: 15 }} className="text-lg font-semibold text-gray-300 mb-4 font-['Poppins',sans-serif]">Collaborators:</h3>
            <div className="users-list space-y-3">
              {project?.users && project.users.length > 0 ? (
                project.users.map((projectUser, index) => {
                  // Ensure projectUser is an object with _id and email
                  const userId = typeof projectUser === 'object' ? projectUser._id : projectUser;
                  const userEmail = typeof projectUser === 'object' ? projectUser.email :
                    users.find(u => u._id === projectUser)?.email || 'Unknown';

                  return (
                    <div
                      key={index}
                      className="user-item flex items-center gap-3 p-2 rounded bg-gray-800"
                    >
                      <div className="avatar w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {userEmail ? userEmail[0].toUpperCase() : '?'}
                        </span>
                      </div>
                      <div className="user-info">
                        <p className="text-gray-300 text-sm font-['Inter',sans-serif]">{userEmail || 'Unknown'}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm font-['Inter',sans-serif]">No collaborators yet</p>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Add Collaborator Modal */}
      {isModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="modal bg-gray-900 rounded-lg shadow-xl w-96 border border-gray-800"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="modal-header border-b border-gray-800 p-4">
              <h3 className="text-lg font-semibold text-gray-300 font-['Poppins',sans-serif]">Add Collaborators</h3>
            </div>
            <div className="modal-body p-4 max-h-80 overflow-y-auto">
              <div className="users-list space-y-2">
                {users.map((u, index) => (
                  <div
                    key={index}
                    className={`user-item flex items-center gap-3 p-2 rounded cursor-pointer ${selectedUserId.has(u._id) ? 'bg-blue-900' : 'bg-gray-800 hover:bg-gray-700'
                      } transition-colors duration-300`}
                    onClick={() => handleUserClick(u._id)}
                  >
                    <div className="avatar w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {u.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="user-info flex-grow">
                      <p className="text-gray-300 text-sm font-['Inter',sans-serif]">{u.email}</p>
                    </div>
                    {selectedUserId.has(u._id) && (
                      <i className="ri-check-line text-blue-400"></i>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer border-t border-gray-800 p-4 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors duration-300 font-['Poppins',sans-serif]"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 font-['Poppins',sans-serif]"
                onClick={addCollaborators}
              >
                Add Selected
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};

export default Project;