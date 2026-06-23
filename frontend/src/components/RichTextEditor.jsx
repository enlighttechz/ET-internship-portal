import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image as ImageIcon, Code, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Quote, Minus, Type, Eye, Edit3, X, Indent, Outdent } from 'lucide-react';
import axios from 'axios';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imgConfig, setImgConfig] = useState({ width: '', height: '', objectFit: 'contain', pos: 'block' });
  const isInternalChange = useRef(false);

  // Only set innerHTML when value changes externally (not from typing)
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value, isPreview]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    const handleEditorClick = (e) => {
      if (e.target.tagName === 'IMG') {
        let pos = 'block';
        if (e.target.style.float === 'left' || e.target.style.float === 'right') {
          pos = e.target.style.float;
        } else if (e.target.style.display === 'inline-block') {
          pos = 'inline-block';
        } else if (e.target.style.margin.includes('auto')) {
          pos = 'center';
        }
        
        setSelectedImage(e.target);
        e.target.style.cursor = 'grab';
        e.target.setAttribute('draggable', 'true');
        
        setImgConfig({
          width: e.target.style.width || e.target.style.maxWidth || '100%',
          height: e.target.style.height || 'auto',
          objectFit: e.target.style.objectFit || 'contain',
          pos
        });
      } else {
        setSelectedImage(null);
      }
    };

    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.target.style.cursor = 'grabbing';
      }
    };

    const handleDrop = () => {
      setTimeout(() => {
        handleInput();
      }, 50);
    };

    const handleDragEnd = (e) => {
      if (e.target.tagName === 'IMG') {
        e.target.style.cursor = 'grab';
        handleInput();
      }
    };
    
    const ed = editorRef.current;
    if (ed) {
      ed.addEventListener('click', handleEditorClick);
      ed.addEventListener('dragstart', handleDragStart);
      ed.addEventListener('drop', handleDrop);
      ed.addEventListener('dragend', handleDragEnd);
    }
    return () => {
      if (ed) {
        ed.removeEventListener('click', handleEditorClick);
        ed.removeEventListener('dragstart', handleDragStart);
        ed.removeEventListener('drop', handleDrop);
        ed.removeEventListener('dragend', handleDragEnd);
      }
    };
  }, [isPreview]);

  const updateImageStyle = (key, val) => {
    if (!selectedImage) return;
    selectedImage.style[key] = val;
    if (key === 'width') selectedImage.style.maxWidth = 'none'; // remove max-width if width is forced
    setImgConfig(prev => ({ ...prev, [key]: val }));
    handleInput();
  };

  const setPosition = (pos) => {
    if (!selectedImage) return;
    if (pos === 'left' || pos === 'right') {
      selectedImage.style.float = pos;
      selectedImage.style.display = 'block';
      selectedImage.style.margin = '8px';
    } else if (pos === 'inline-block') {
      selectedImage.style.float = 'none';
      selectedImage.style.display = 'inline-block';
      selectedImage.style.margin = '8px';
    } else if (pos === 'center') {
      selectedImage.style.float = 'none';
      selectedImage.style.display = 'block';
      selectedImage.style.margin = '8px auto';
    } else { // block
      selectedImage.style.float = 'none';
      selectedImage.style.display = 'block';
      selectedImage.style.margin = '8px 0';
    }
    setImgConfig(prev => ({ ...prev, pos }));
    handleInput();
  };

  const execCmd = (command, val = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const changeFontSize = (delta) => {
    editorRef.current?.focus();
    let currentSize = document.queryCommandValue('fontSize');
    // If not set, standard default is usually 3
    if (!currentSize || currentSize === '') currentSize = 3;
    let newSize = Math.max(1, Math.min(7, parseInt(currentSize) + delta));
    document.execCommand('fontSize', false, newSize);
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) execCmd('createLink', url);
  };

  const insertImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      
      const res = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData);
      const url = res.data.data.url;
      
      editorRef.current?.focus();
      execCmd('insertHTML', `<img src="${url}" alt="Uploaded Image" draggable="true" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;cursor:grab;" />`);
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertCode = () => {
    execCmd('insertHTML', '<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;font-family:monospace;font-size:13px;overflow-x:auto;"><code>// your code here</code></pre><br/>');
  };

  const insertHR = () => {
    execCmd('insertHTML', '<hr style="border:none;border-top:2px solid #e2e8f0;margin:16px 0;" />');
  };

  const ToolBtn = ({ icon: Icon, title, onClick, text }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md transition-colors text-text-dim hover:text-text-primary hover:bg-primary/10 font-bold"
    >
      {Icon ? <Icon size={16} /> : text}
    </button>
  );

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-outline-variant/50 bg-surface-container-lowest">
        <ToolBtn icon={Bold} title="Bold" onClick={() => execCmd('bold')} />
        <ToolBtn icon={Italic} title="Italic" onClick={() => execCmd('italic')} />
        <ToolBtn icon={Underline} title="Underline" onClick={() => execCmd('underline')} />
        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolBtn icon={Heading1} title="Heading 1" onClick={() => execCmd('formatBlock', '<H1>')} />
        <ToolBtn icon={Heading2} title="Heading 2" onClick={() => execCmd('formatBlock', '<H2>')} />
        <ToolBtn icon={Type} title="Paragraph" onClick={() => execCmd('formatBlock', '<p>')} />
        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolBtn text="A+" title="Increase Text Size" onClick={() => changeFontSize(1)} />
        <ToolBtn text="A-" title="Decrease Text Size" onClick={() => changeFontSize(-1)} />
        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolBtn icon={List} title="Bullet List" onClick={() => execCmd('insertUnorderedList')} />
        <ToolBtn icon={ListOrdered} title="Numbered List" onClick={() => execCmd('insertOrderedList')} />
        <ToolBtn icon={Quote} title="Blockquote" onClick={() => execCmd('formatBlock', '<BLOCKQUOTE>')} />
        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolBtn icon={AlignLeft} title="Align Left" onClick={() => execCmd('justifyLeft')} />
        <ToolBtn icon={AlignCenter} title="Align Center" onClick={() => execCmd('justifyCenter')} />
        <ToolBtn icon={AlignRight} title="Align Right" onClick={() => execCmd('justifyRight')} />
        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolBtn icon={Outdent} title="Decrease Indent" onClick={() => execCmd('outdent')} />
        <ToolBtn icon={Indent} title="Increase Indent" onClick={() => execCmd('indent')} />
        <div className="w-px h-5 bg-outline-variant/50 mx-1" />
        <ToolBtn icon={Link} title="Insert Link" onClick={insertLink} />
        
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertImageClick}
          title="Upload Image"
          disabled={isUploading}
          className={`p-1.5 rounded-md transition-colors ${isUploading ? 'text-primary animate-pulse bg-primary/10' : 'text-text-dim hover:text-text-primary hover:bg-primary/10'}`}
        >
          <ImageIcon size={16} />
        </button>

        <ToolBtn icon={Code} title="Insert Code Block" onClick={insertCode} />
        <ToolBtn icon={Minus} title="Horizontal Line" onClick={insertHR} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-colors ${isPreview ? 'bg-primary text-white' : 'bg-surface-container text-text-dim hover:text-primary'}`}
        >
          {isPreview ? <Edit3 size={12} /> : <Eye size={12} />}
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor / Preview Area */}
      <div className="relative">
        {selectedImage && !isPreview && (
          <div className="absolute top-2 right-2 bg-white border border-outline-variant rounded-lg shadow-lg p-4 z-10 flex flex-col gap-3 animate-fade-in text-xs w-64">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
              <span className="font-bold text-text-primary">Image Settings</span>
              <button onClick={() => setSelectedImage(null)} className="text-text-dim hover:text-error bg-surface-container rounded-full p-1"><X size={14}/></button>
            </div>
            
            <div className="flex gap-2">
              <label className="flex-1 font-bold text-text-dim">Width
                <input type="text" placeholder="e.g. 100% or 300px" value={imgConfig.width} onChange={e => updateImageStyle('width', e.target.value)} className="w-full p-1.5 mt-1 border border-outline-variant rounded bg-surface font-normal text-text-primary" />
              </label>
              <label className="flex-1 font-bold text-text-dim">Height
                <input type="text" placeholder="e.g. auto or 200px" value={imgConfig.height} onChange={e => updateImageStyle('height', e.target.value)} className="w-full p-1.5 mt-1 border border-outline-variant rounded bg-surface font-normal text-text-primary" />
              </label>
            </div>
            
            <label className="font-bold text-text-dim">Position & Alignment
              <select value={imgConfig.pos} onChange={e => setPosition(e.target.value)} className="w-full p-1.5 mt-1 border border-outline-variant rounded bg-surface font-normal text-text-primary">
                <option value="block">Full Width Block (Default)</option>
                <option value="center">Centered Block</option>
                <option value="inline-block">Inline with Text</option>
                <option value="left">Float Left</option>
                <option value="right">Float Right</option>
              </select>
            </label>
            
            <label className="font-bold text-text-dim">Crop / Object Fit
              <select value={imgConfig.objectFit} onChange={e => updateImageStyle('objectFit', e.target.value)} className="w-full p-1.5 mt-1 border border-outline-variant rounded bg-surface font-normal text-text-primary">
                <option value="contain">Contain (No Crop, Fit Inside)</option>
                <option value="cover">Cover (Crop to fill bounds)</option>
                <option value="fill">Stretch (Distort to fill)</option>
              </select>
            </label>
          </div>
        )}
      {isPreview ? (
        <div 
          className="p-4 min-h-[200px] prose prose-sm max-w-none text-text-primary"
          dir="ltr"
          dangerouslySetInnerHTML={{ __html: value || '<p class="text-text-dim italic">Nothing to preview yet...</p>' }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir="ltr"
          className="p-4 min-h-[200px] outline-none text-sm text-text-primary leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-dim [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-xs [&_pre]:overflow-x-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:mb-1 [&_p]:mb-2 [&_p]:min-h-[1em]"
          onInput={handleInput}
          data-placeholder={placeholder || 'Start writing your course content...'}
          style={{ minHeight: '200px', textAlign: 'left', direction: 'ltr', unicodeBidi: 'plaintext' }}
        />
      )}
      </div>
    </div>
  );
};

export default RichTextEditor;
