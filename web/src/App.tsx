import { useEffect, useState } from 'react'
import './App.css'

type Role = 'owner' | 'admin' | 'member' | string

type UserProfile = {
  id: string
  email: string
  full_name: string
  role: Role
  organization_id: string | null
  created_organization_id: string | null
}

type Organization = {
  id: string
  name: string
  domain: string | null
  timezone: string | null
  owner_user_id: string
}

type Member = {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
}

type FormFieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'radio' | 'boolean'

type FieldDraft = {
  id: string
  key: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder: string
  helperText: string
  minLength: string
  maxLength: string
  regex: string
  optionsText: string
}

type FormRecord = {
  id: string
  organization_id: string
  title: string
  description: string | null
  slug: string
  status: 'draft' | 'published' | string
  version: number
  fields: Array<{
    key: string
    label: string
    type: FormFieldType
    required: boolean
  }>
  created_at: string
  updated_at: string
  published_at: string | null
}

type ApiError = {
  detail?: string
  message?: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000'
const TOKEN_KEY = 'leadpilot.token'

const fieldTypes: FormFieldType[] = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'select',
  'multiselect',
  'date',
  'checkbox',
  'radio',
  'boolean',
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createFieldDraft(type: FormFieldType = 'text'): FieldDraft {
  const uid = crypto.randomUUID()
  return {
    id: uid,
    key: `field-${uid.slice(0, 8)}`,
    label: 'Lead field',
    type,
    required: false,
    placeholder: '',
    helperText: '',
    minLength: '',
    maxLength: '',
    regex: '',
    optionsText: '',
  }
}

async function requestJson<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    let errorMessage = response.statusText
    try {
      const payload = (await response.json()) as ApiError
      errorMessage = payload.detail ?? payload.message ?? errorMessage
    } catch {
      const text = await response.text()
      if (text) {
        errorMessage = text
      }
    }
    throw new Error(errorMessage)
  }

  return (await response.json()) as T
}

function App() {
  const [tokenInput, setTokenInput] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(TOKEN_KEY) ?? ''
  })
  const [token, setToken] = useState(tokenInput)
  const [authUrl, setAuthUrl] = useState('')
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [forms, setForms] = useState<FormRecord[]>([])
  const [googleInviteToken, setGoogleInviteToken] = useState('')
  const [orgName, setOrgName] = useState('LeadPilot AI')
  const [orgDomain, setOrgDomain] = useState('')
  const [orgTimezone, setOrgTimezone] = useState('UTC')
  const [inviteEmail, setInviteEmail] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [builderTitle, setBuilderTitle] = useState('Lead intake form')
  const [builderDescription, setBuilderDescription] = useState('Capture and qualify inbound leads from every campaign.')
  const [builderSlug, setBuilderSlug] = useState('lead-intake')
  const [fields, setFields] = useState<FieldDraft[]>([createFieldDraft('text')])

  useEffect(() => {
    if (token) {
      void loadWorkspace(token)
    }
  }, [token])

  function persistToken(nextToken: string) {
    setTokenInput(nextToken)
    setToken(nextToken)
    window.localStorage.setItem(TOKEN_KEY, nextToken)
  }

  function clearToken() {
    setTokenInput('')
    setToken('')
    setCurrentUser(null)
    setOrganization(null)
    setMembers([])
    setForms([])
    window.localStorage.removeItem(TOKEN_KEY)
  }

  async function loadWorkspace(nextToken = token) {
    if (!nextToken) {
      setStatusMessage('Paste a JWT or complete Google sign-in to load your workspace.')
      return
    }

    try {
      setStatusMessage('Loading workspace...')
      const profile = await requestJson<UserProfile>('/api/auth/me', {}, nextToken)
      setCurrentUser(profile)

      if (profile.organization_id) {
        const org = await requestJson<Organization>(`/api/orgs/${profile.organization_id}`, {}, nextToken)
        setOrganization(org)
        const orgForms = await requestJson<FormRecord[]>('/api/forms', {}, nextToken)
        setForms(orgForms)
        const orgMembers = await requestJson<Member[]>(`/api/orgs/${profile.organization_id}/members`, {}, nextToken)
        setMembers(orgMembers)
        setStatusMessage(`Loaded ${org.name}.`)
      } else {
        setOrganization(null)
        setForms([])
        setMembers([])
        setStatusMessage('Authenticated. Create your organization to unlock forms and invites.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load workspace'
      setStatusMessage(message)
    }
  }

  async function generateGoogleAuthUrl() {
    try {
      const suffix = googleInviteToken ? `?invite_token=${encodeURIComponent(googleInviteToken)}` : ''
      const payload = await requestJson<{ auth_url: string; state: string }>(`/api/auth/google/start${suffix}`)
      setAuthUrl(payload.auth_url)
      setStatusMessage('Google OAuth link generated. Open it, finish the Google flow, then paste the returned JWT into the token field.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate Google login link'
      setStatusMessage(message)
    }
  }

  async function createOrganization() {
    if (!token) {
      setStatusMessage('Save a token first.')
      return
    }

    try {
      const payload = {
        name: orgName,
        domain: orgDomain || null,
        timezone: orgTimezone || null,
      }
      const created = await requestJson<Organization>('/api/orgs', { method: 'POST', body: JSON.stringify(payload) }, token)
      setOrganization(created)
      setStatusMessage(`Organization created: ${created.name}`)
      await loadWorkspace(token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create organization'
      setStatusMessage(message)
    }
  }

  async function sendInvite() {
    if (!token || !currentUser?.organization_id) {
      setStatusMessage('Create or join an organization first.')
      return
    }

    try {
      const payload = { email: inviteEmail }
      await requestJson(`/api/orgs/${currentUser.organization_id}/invite`, { method: 'POST', body: JSON.stringify(payload) }, token)
      setInviteEmail('')
      setStatusMessage('Invite sent and email dispatch queued.')
      await loadWorkspace(token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send invite'
      setStatusMessage(message)
    }
  }

  async function createForm() {
    if (!token || !currentUser?.organization_id) {
      setStatusMessage('You need an organization before you can create forms.')
      return
    }

    try {
      const payload = {
        title: builderTitle,
        description: builderDescription || null,
        slug: builderSlug ? slugify(builderSlug) : null,
        fields: fields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || null,
          helper_text: field.helperText || null,
          min_length: field.minLength ? Number(field.minLength) : null,
          max_length: field.maxLength ? Number(field.maxLength) : null,
          regex: field.regex || null,
          options: field.optionsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [label, value] = line.split('|').map((part) => part.trim())
              return {
                label: label || value,
                value: value || label,
              }
            }),
        })),
      }

      await requestJson<FormRecord>('/api/forms', { method: 'POST', body: JSON.stringify(payload) }, token)
      setStatusMessage('Form created successfully.')
      setFields([createFieldDraft('text')])
      await loadWorkspace(token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create form'
      setStatusMessage(message)
    }
  }

  async function publishForm(formId: string) {
    if (!token) return
    try {
      await requestJson<FormRecord>(`/api/forms/${formId}/publish`, { method: 'POST' }, token)
      setStatusMessage('Form published.')
      await loadWorkspace(token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish form'
      setStatusMessage(message)
    }
  }

  function updateField(id: string, patch: Partial<FieldDraft>) {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  function addField(type: FormFieldType = 'text') {
    setFields((current) => [...current, createFieldDraft(type)])
  }

  function removeField(id: string) {
    setFields((current) => current.filter((field) => field.id !== id))
  }

  const previewPayload = {
    title: builderTitle,
    description: builderDescription || null,
    slug: builderSlug ? slugify(builderSlug) : null,
    fields: fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || null,
      helper_text: field.helperText || null,
      min_length: field.minLength ? Number(field.minLength) : null,
      max_length: field.maxLength ? Number(field.maxLength) : null,
      regex: field.regex || null,
      options: field.optionsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, value] = line.split('|').map((part) => part.trim())
          return {
            label: label || value,
            value: value || label,
          }
        }),
    })),
  }

  return (
    <main className="app-shell">
      <div className="background-orb orb-a" />
      <div className="background-orb orb-b" />

      <header className="topbar">
        <div>
          <p className="eyebrow">LeadPilot AI</p>
          <h1>Workspace setup for orgs, invites, Google OAuth, and forms.</h1>
          <p className="subhead">
            Create one organization, invite people into it, sign in with Google or email credentials, and build lead capture forms from the same workspace.
          </p>
        </div>

        <div className="topbar-status">
          <span className="status-pill">Backend: {API_BASE}</span>
          <span className="status-pill">Token: {token ? 'loaded' : 'missing'}</span>
          <span className="status-pill">Forms: {forms.length}</span>
        </div>
      </header>

      <section className="notice-bar">
        <span>{statusMessage || 'Ready.'}</span>
        <span className="notice-link">Google OAuth returns a JWT from the callback. Paste it below to load the workspace.</span>
      </section>

      <section className="layout-grid">
        <div className="column-stack">
          <article className="panel glass">
            <div className="panel-head">
              <div>
                <p className="panel-label">Auth</p>
                <h2>Google OAuth and JWT</h2>
              </div>
              <button className="ghost-button" onClick={clearToken}>Clear token</button>
            </div>

            <div className="form-grid two-col">
              <label className="field">
                <span>Invite token</span>
                <input value={googleInviteToken} onChange={(event) => setGoogleInviteToken(event.target.value)} placeholder="Optional invite token" />
              </label>
              <label className="field">
                <span>JWT access token</span>
                <input value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Paste JWT from Google or email signup" />
              </label>
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={() => void generateGoogleAuthUrl()}>Generate Google OAuth link</button>
              <button className="secondary-button" onClick={() => { persistToken(tokenInput); void loadWorkspace(tokenInput) }}>Load workspace</button>
            </div>

            <div className="inline-link-row">
              {authUrl ? (
                <a className="inline-link" href={authUrl} target="_blank" rel="noreferrer">
                  Open Google auth
                </a>
              ) : (
                <span className="muted">Generate the OAuth link to continue.</span>
              )}
            </div>
          </article>

          <article className="panel glass">
            <div className="panel-head">
              <div>
                <p className="panel-label">Organization</p>
                <h2>Create the workspace</h2>
              </div>
              <span className="status-chip">One org per user</span>
            </div>

            <div className="form-grid two-col">
              <label className="field">
                <span>Organization name</span>
                <input value={orgName} onChange={(event) => setOrgName(event.target.value)} placeholder="LeadPilot AI" />
              </label>
              <label className="field">
                <span>Domain</span>
                <input value={orgDomain} onChange={(event) => setOrgDomain(event.target.value)} placeholder="leadpilot.ai" />
              </label>
              <label className="field full-span">
                <span>Timezone</span>
                <input value={orgTimezone} onChange={(event) => setOrgTimezone(event.target.value)} placeholder="UTC" />
              </label>
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={() => void createOrganization()} disabled={!token}>Create organization</button>
              <span className="helper-text">The creator becomes the owner and can invite members.</span>
            </div>

            {organization ? (
              <div className="summary-card">
                <strong>{organization.name}</strong>
                <p>{organization.domain || 'No domain set'} · {organization.timezone || 'No timezone set'}</p>
              </div>
            ) : null}
          </article>

          <article className="panel glass">
            <div className="panel-head">
              <div>
                <p className="panel-label">Invites</p>
                <h2>Add people to the org</h2>
              </div>
              <span className="status-chip">Email invite</span>
            </div>

            <div className="form-grid single-col">
              <label className="field">
                <span>Invite email</span>
                <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="member@company.com" />
              </label>
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={() => void sendInvite()} disabled={!token || !currentUser?.organization_id}>Send invite</button>
              <span className="helper-text">If the user has no account yet, they will sign up from the invite flow.</span>
            </div>

            <div className="members-list">
              {members.length > 0 ? members.map((member) => (
                <div className="member-row" key={member.id}>
                  <div>
                    <strong>{member.full_name}</strong>
                    <p>{member.email}</p>
                  </div>
                  <span className="status-pill compact">{member.role}</span>
                </div>
              )) : <p className="muted">No members loaded yet.</p>}
            </div>
          </article>
        </div>

        <div className="column-stack">
          <article className="panel glass form-builder">
            <div className="panel-head">
              <div>
                <p className="panel-label">Forms</p>
                <h2>Create a lead capture form</h2>
              </div>
              <button className="ghost-button" onClick={() => addField('text')}>Add field</button>
            </div>

            <div className="form-grid two-col">
              <label className="field">
                <span>Form title</span>
                <input value={builderTitle} onChange={(event) => setBuilderTitle(event.target.value)} placeholder="Lead intake form" />
              </label>
              <label className="field">
                <span>Slug</span>
                <input value={builderSlug} onChange={(event) => setBuilderSlug(event.target.value)} placeholder="lead-intake" />
              </label>
              <label className="field full-span">
                <span>Description</span>
                <textarea value={builderDescription} onChange={(event) => setBuilderDescription(event.target.value)} rows={3} placeholder="Describe the form purpose" />
              </label>
            </div>

            <div className="builder-actions">
              {fieldTypes.map((type) => (
                <button key={type} className="chip-button" onClick={() => addField(type)}>
                  + {type}
                </button>
              ))}
            </div>

            <div className="field-stack">
              {fields.map((field, index) => (
                <section className="field-card" key={field.id}>
                  <div className="panel-head compact-head">
                    <strong>Field {index + 1}</strong>
                    <button className="text-button danger" onClick={() => removeField(field.id)} disabled={fields.length === 1}>Remove</button>
                  </div>

                  <div className="form-grid two-col">
                    <label className="field">
                      <span>Key</span>
                      <input value={field.key} onChange={(event) => updateField(field.id, { key: event.target.value })} placeholder="first_name" />
                    </label>
                    <label className="field">
                      <span>Type</span>
                      <select value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as FormFieldType })}>
                        {fieldTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field full-span">
                      <span>Label</span>
                      <input value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} placeholder="First name" />
                    </label>
                    <label className="field full-span">
                      <span>Placeholder</span>
                      <input value={field.placeholder} onChange={(event) => updateField(field.id, { placeholder: event.target.value })} placeholder="Enter first name" />
                    </label>
                    <label className="field full-span">
                      <span>Helper text</span>
                      <input value={field.helperText} onChange={(event) => updateField(field.id, { helperText: event.target.value })} placeholder="Shown under the field" />
                    </label>
                    <label className="field">
                      <span>Min length</span>
                      <input value={field.minLength} onChange={(event) => updateField(field.id, { minLength: event.target.value })} placeholder="2" />
                    </label>
                    <label className="field">
                      <span>Max length</span>
                      <input value={field.maxLength} onChange={(event) => updateField(field.id, { maxLength: event.target.value })} placeholder="60" />
                    </label>
                    <label className="field full-span">
                      <span>Validation regex</span>
                      <input value={field.regex} onChange={(event) => updateField(field.id, { regex: event.target.value })} placeholder="^[A-Za-z]+$" />
                    </label>
                    <label className="field full-span">
                      <span>Options</span>
                      <textarea
                        value={field.optionsText}
                        onChange={(event) => updateField(field.id, { optionsText: event.target.value })}
                        rows={3}
                        placeholder={'One option per line. Use Label|Value when needed.\nHigh|high\nMedium|medium\nLow|low'}
                      />
                    </label>
                    <label className="checkbox-field">
                      <input type="checkbox" checked={field.required} onChange={(event) => updateField(field.id, { required: event.target.checked })} />
                      Required
                    </label>
                  </div>
                </section>
              ))}
            </div>

            <div className="button-row">
              <button className="primary-button" onClick={() => void createForm()} disabled={!token || !currentUser?.organization_id}>Create form</button>
              <span className="helper-text">Published forms and version history are stored in MongoDB.</span>
            </div>
          </article>

          <article className="panel glass preview-panel">
            <div className="panel-head">
              <div>
                <p className="panel-label">Preview</p>
                <h2>Payload sent to the API</h2>
              </div>
              <span className="status-chip">JSON preview</span>
            </div>
            <pre className="code-block">{JSON.stringify(previewPayload, null, 2)}</pre>
          </article>

          <article className="panel glass">
            <div className="panel-head">
              <div>
                <p className="panel-label">Saved forms</p>
                <h2>Workspace forms</h2>
              </div>
              <span className="status-chip">{forms.length} total</span>
            </div>

            <div className="forms-grid">
              {forms.length > 0 ? forms.map((form) => (
                <div className="form-card" key={form.id}>
                  <div className="form-card-head">
                    <div>
                      <strong>{form.title}</strong>
                      <p>{form.slug}</p>
                    </div>
                    <span className={`state-pill ${form.status}`}>{form.status}</span>
                  </div>
                  <p className="muted">Version {form.version} · {form.fields.length} fields</p>
                  <div className="button-row compact">
                    <button className="secondary-button" onClick={() => void publishForm(form.id)} disabled={form.status === 'published' || !token}>Publish</button>
                  </div>
                </div>
              )) : <p className="muted">No forms yet. Create one in the builder.</p>}
            </div>
          </article>
        </div>

        <aside className="column-stack side-column">
          <article className="panel glass status-panel">
            <div className="panel-head">
              <div>
                <p className="panel-label">Profile</p>
                <h2>Current user</h2>
              </div>
              <button className="ghost-button" onClick={() => void loadWorkspace()}>Refresh</button>
            </div>

            {currentUser ? (
              <div className="summary-stack">
                <div className="summary-card">
                  <strong>{currentUser.full_name}</strong>
                  <p>{currentUser.email}</p>
                </div>
                <div className="info-grid">
                  <div>
                    <span>Role</span>
                    <strong>{currentUser.role}</strong>
                  </div>
                  <div>
                    <span>Organization</span>
                    <strong>{currentUser.organization_id ?? 'None'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">No profile loaded. Paste a token or authenticate with Google.</p>
            )}
          </article>

          <article className="panel glass status-panel">
            <div className="panel-head">
              <div>
                <p className="panel-label">Steps</p>
                <h2>Suggested flow</h2>
              </div>
            </div>
            <ol className="steps-list">
              <li>Generate Google OAuth and sign in.</li>
              <li>Paste the JWT returned by the callback.</li>
              <li>Create your organization once.</li>
              <li>Invite teammates or join with an invite token.</li>
              <li>Create and publish lead capture forms.</li>
            </ol>
          </article>
        </aside>
      </section>
    </main>
  )
}

export default App
