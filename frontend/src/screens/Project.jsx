import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import 'highlight.js/styles/nord.min.css' // Import a style directly
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
  const ref = useRef(null)

  React.useEffect(() => {
    if (ref.current && props.className?.includes('lang-')) {
      // Use the imported hljs directly instead of window.hljs
      hljs.highlightElement(ref.current)

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute('data-highlighted')
    }
  }, [props.className, props.children])

  return <code {...props} ref={ref} />
}


const Project = () => {

  const location = useLocation()

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(new Set()) // Initialized as Set
  const [project, setProject] = useState(location.state.project)
  const [message, setMessage] = useState('')
  const { user } = useContext(UserContext)
  const messageBox = useRef(null) // Changed to useRef hook

  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([]) // New state variable for messages
  const [fileTree, setFileTree] = useState({})

  const [currentFile, setCurrentFile] = useState(null)
  const [openFiles, setOpenFiles] = useState([])

  const [webContainer, setWebContainer] = useState(null)
  const [iframeUrl, setIframeUrl] = useState(null)

  const [runProcess, setRunProcess] = useState(null)
  const [runningStatus, setRunningStatus] = useState('idle') // Add status for better UX

  // Add this function to restructure file paths with slashes into proper nested objects
  const restructureFileTree = (fileTree) => {
    const newTree = {};

    // Process each file path
    Object.keys(fileTree).forEach(path => {
      // Skip if it's already a proper structure (no slashes)
      if (!path.includes('/')) {
        newTree[path] = fileTree[path];
        return;
      }

      // Split path into segments
      const segments = path.split('/');
      let currentLevel = newTree;

      // Process all segments except the last one (which is the file name)
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];

        // Create directory if it doesn't exist
        if (!currentLevel[segment]) {
          currentLevel[segment] = { directory: {} };
        } else if (!currentLevel[segment].directory) {
          // Handle case where it might exist but not as a directory
          currentLevel[segment] = { directory: {} };
        }

        // Move to next level
        currentLevel = currentLevel[segment].directory;
      }

      // Add the file at the appropriate level
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
      setIsModalOpen(false)
    }).catch(err => {
      console.log(err)
    })
  }

  const send = () => {
    if (!message.trim()) return; // Prevent sending empty messages

    sendMessage('project-message', {
      message,
      sender: user
    })
    setMessages(prevMessages => [...prevMessages, { sender: user, message }]) // Update messages state
    setMessage("")

    // Scroll to bottom after sending
    setTimeout(scrollToBottom, 100);
  }

  function WriteAiMessage(message) {
    try {
      const messageObject = JSON.parse(message)
      return (
        <div className='overflow-auto bg-black text-white rounded-sm p-2'>
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
      return <div className='overflow-auto bg-black text-white rounded-sm p-2'>{message}</div>
    }
  }

  useEffect(() => {
    // Initialize highlight.js when component mounts
    hljs.configure({
      ignoreUnescapedHTML: true
    });

    // Register common languages
    const codeElements = document.querySelectorAll('pre code');
    codeElements.forEach((el) => {
      hljs.highlightElement(el);
    });
  }, []);

  useEffect(() => {
    initializeSocket(project._id)

    if (!webContainer) {
      getWebContainer().then(container => {
        setWebContainer(container)
        console.log("container started")
      })
    }

    receiveMessage('project-message', data => {
      console.log("Received message:", data);

      // Create a standardized message object to handle all cases
      let messageObj = {
        sender: {
          _id: data.sender?._id || 'ai',
          email: data.sender?.email || 'AI Assistant'
        },
        message: data.message || ''
      };

      // Handle AI messages with file tree data
      if (messageObj.sender._id === 'ai') {
        try {
          // Try to parse the message as JSON
          const parsedMessage = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;

          if (parsedMessage.fileTree) {
            // Process file tree before mounting to handle nested paths correctly
            const restructuredFileTree = restructureFileTree(parsedMessage.fileTree);
            webContainer?.mount(restructuredFileTree);
            setFileTree(parsedMessage.fileTree); // Keep original for display but mount restructured
          }
        } catch (error) {
          console.error("Error handling AI message:", error)
          // If parsing fails, continue with the original message
        }
      }

      setMessages(prevMessages => [...prevMessages, messageObj]);

      // Scroll to bottom when receiving a new message
      setTimeout(scrollToBottom, 100);
    });

    axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
      console.log(res.data.project)
      setProject(res.data.project)
      setFileTree(res.data.project.fileTree || {})
    })

    axios.get('/users/all').then(res => {
      setUsers(res.data.users)
    }).catch(err => {
      console.log(err)
    })

    // Scroll to bottom when component mounts to ensure initial messages are visible
    setTimeout(scrollToBottom, 300);

  }, [])

  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add effect to rehighlight code when currentFile changes
  useEffect(() => {
    if (currentFile) {
      // Find the code element in the editor and highlight it
      const codeElement = document.querySelector('.code-editor-area pre code');
      if (codeElement) {
        hljs.highlightElement(codeElement);
      }
    }
  }, [currentFile, fileTree]);

  function saveFileTree(ft) {
    // Keep the original structure for saving to the database
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

  // Helper function to detect file type
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

  // Create a simple server to serve files
  const createSimpleServer = async () => {
    try {
      // Create a simple server.js file to serve static content
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

      // Create a simple HTML file if none exists
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

      // Add the server.js file to the container
      await webContainer.fs.writeFile('server.js', serverFileContent);

      // Ensure we have at least one HTML file
      await createDefaultHtml();

      return true;
    } catch (error) {
      console.error('Error creating simple server:', error);
      return false;
    }
  };

  // Run the appropriate command based on file type
  const runCurrentProject = async () => {
    try {
      setRunningStatus('starting');

      // Kill any existing process
      if (runProcess) {
        runProcess.kill();
        setRunProcess(null);
      }

      // Restructure the file tree before mounting
      const restructuredFileTree = restructureFileTree(fileTree);

      // Mount the restructured file tree
      await webContainer.mount(restructuredFileTree);

      // Determine if this is an HTML/static project or a Node.js project
      const hasPackageJson = Object.keys(fileTree).includes('package.json');
      const hasHtmlFiles = Object.keys(fileTree).some(file =>
        file.toLowerCase().endsWith('.html') || file.toLowerCase().endsWith('.htm')
      );

      if (hasPackageJson) {
        // This is a Node.js project, proceed with npm install and npm start
        const installProcess = await webContainer.spawn("npm", ["install"]);

        installProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk);
          }
        }));

        // Wait for installation to complete
        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          console.error('npm install failed with exit code', installExitCode);
          setRunningStatus('error');
          return;
        }

        // Start the application
        const startProcess = await webContainer.spawn("npm", ["start"]);

        startProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk);
          }
        }));

        setRunProcess(startProcess);
      } else if (hasHtmlFiles) {
        // This is a static HTML project
        // Create a simple server to serve HTML files
        const serverCreated = await createSimpleServer();

        if (!serverCreated) {
          setRunningStatus('error');
          return;
        }

        // Start the simple server
        const serverProcess = await webContainer.spawn("node", ["server.js"]);

        serverProcess.output.pipeTo(new WritableStream({
          write(chunk) {
            console.log(chunk);
          }
        }));

        setRunProcess(serverProcess);

        // Set the iframe URL manually since we know it's running on port 3000
        setIframeUrl('http://localhost:3000');
      } else {
        console.error('No supported files found to run');
        setRunningStatus('error');
        return;
      }

      // Listen for server-ready event
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

  // Function to determine if a message is from the current user
  const isCurrentUserMessage = (messageObj) => {
    return messageObj.sender._id === user._id?.toString();
  };

  return (
    <main className='h-screen w-screen flex'>
      <section className="left relative flex flex-col h-screen min-w-96 bg-slate-300">
        <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-100 absolute z-10 top-0 mb-2'>
          <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-fill mr-1"></i>
            <p>Add collaborator</p>
          </button>
          <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversation-area pt-14 pb-16 flex-grow flex flex-col min-h-96 relative">

          {/* Added proper padding to avoid overlap with header and input field */}
          <div
            ref={messageBox}
            className="message-box pt-16 pb-20 p-3 flex-grow flex flex-col gap-3 overflow-auto max-h-80 scrollbar-hide">
            {messages.map((msg, index) => (
              <div key={index}
                className={`message-container flex w-full ${isCurrentUserMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`message flex flex-col p-3 ${msg.sender._id === 'ai' ? 'bg-slate-200 max-w-80' :
                    isCurrentUserMessage(msg) ? 'bg-blue-100 max-w-64' : 'bg-slate-50 max-w-64'
                    } rounded-lg shadow-sm ${isCurrentUserMessage(msg) ? 'rounded-tr-none' : 'rounded-tl-none'
                    }`}>
                  <small className='text-xs text-gray-600 mb-1'>{msg.sender.email || 'Unknown'}</small>
                  <div className='text-sm'>
                    {msg.sender._id === 'ai' ?
                      WriteAiMessage(msg.message)
                      : <p className="break-words">{msg.message}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="inputField w-full flex absolute bottom-0 bg-white">
            {/* Added bg-white to ensure input is visible */}
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  send();
                }
              }}
              className='p-2 px-4 border-none outline-none flex-grow'
              type="text"
              placeholder='Enter message' />
            <button
              onClick={send}
              className='px-5 bg-blue-500 text-white cursor-pointer'>
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>

        </div>

        <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
          <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>

            <h1
              className='font-semibold text-lg'
            >Collaborators</h1>

            <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
              <i className="ri-close-fill"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-2">

            {project.users && project.users.map((user, index) => {
              return (
                <div key={index} className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                  <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className='font-semibold text-lg'>{user.email}</h1>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="right bg-red-50 flex-grow h-full flex">

        <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
          <div className="file-tree w-full">
            {
              Object.keys(fileTree).map((file, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentFile(file)
                    setOpenFiles([...new Set([...openFiles, file])])
                  }}
                  className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full">
                  <p
                    className='font-semibold text-lg'
                  >{file}</p>
                </button>))

            }
          </div>

        </div>


        <div className="code-editor flex flex-col flex-grow h-full shrink">

          <div className="top flex justify-between w-full">

            <div className="files flex">
              {
                openFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFile(file)}
                    className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''}`}>
                    <p
                      className='font-semibold text-lg'
                    >{file}</p>
                  </button>
                ))
              }
            </div>

            <div className="actions flex gap-2">
              <button
                onClick={runCurrentProject}
                className={`p-2 px-4 ${runningStatus === 'starting' ? 'bg-yellow-500' : runningStatus === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}
                disabled={runningStatus === 'starting'}
              >
                {runningStatus === 'starting' ? 'Starting...' : 'Run'}
              </button>
            </div>
          </div>
          <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
            {
              fileTree[currentFile] && (
                <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                  <pre
                    className="hljs h-full">
                    <code
                      className={`hljs h-full outline-none language-${getFileType(currentFile)}`}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const updatedContent = e.target.innerText;
                        const ft = {
                          ...fileTree,
                          [currentFile]: {
                            file: {
                              contents: updatedContent
                            }
                          }
                        }
                        setFileTree(ft)
                        saveFileTree(ft)

                        // Re-highlight the code after saving
                        if (e.target) {
                          hljs.highlightElement(e.target);
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: fileTree[currentFile].file.contents
                      }}
                      style={{
                        whiteSpace: 'pre-wrap',
                        paddingBottom: '25rem',
                        counterSet: 'line-numbering',
                      }}
                    />
                  </pre>
                </div>
              )
            }
          </div>

        </div>

        {iframeUrl && webContainer &&
          (<div className="flex min-w-96 flex-col h-full">
            <div className="address-bar">
              <input type="text"
                onChange={(e) => setIframeUrl(e.target.value)}
                value={iframeUrl} className="w-full p-2 px-4 bg-slate-200" />
            </div>
            <iframe src={iframeUrl} className="w-full h-full"></iframe>
          </div>)
        }


      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
            <header className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className='p-2'>
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
              {users.map((user, index) => (
                <div key={index} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) !== -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                  <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className='font-semibold text-lg'>{user.email}</h1>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default Project